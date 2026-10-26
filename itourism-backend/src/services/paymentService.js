const axios = require("axios");
const prisma = require("../lib/prisma");
const env = require("../config/env");
const logger = require("../config/logger");
const AppError = require("../lib/AppError");
const { normalizePhone } = require("../lib/phone");
const { toDateString } = require("../lib/dates");
const sms = require("./smsService");

const DARAJA_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function assertConfigured() {
  const d = env.daraja;
  const missing = ["consumerKey", "consumerSecret", "shortcode", "passkey", "callbackUrl"].filter((k) => !d[k]);
  if (missing.length) {
    logger.error("Daraja is not configured", { missing });
    throw new AppError("Payments are temporarily unavailable", 500, "MPESA_NOT_CONFIGURED");
  }
  if (!d.callbackUrl.startsWith("https://")) {
    throw new AppError("Payments are temporarily unavailable", 500, "MPESA_NOT_CONFIGURED");
  }
}

async function getAccessToken() {
  const auth = Buffer.from(`${env.daraja.consumerKey}:${env.daraja.consumerSecret}`).toString("base64");
  try {
    const res = await axios.get(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 15000,
    });
    return res.data.access_token;
  } catch (err) {
    logger.error("Daraja auth failed", { status: err.response?.status, data: err.response?.data });
    throw new AppError("Could not reach M-Pesa. Please try again.", 502, "MPESA_UNAVAILABLE");
  }
}

// Daraja expects YYYYMMDDHHmmss in Nairobi time, regardless of the server's timezone.
function timestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return `${g("year")}${g("month")}${g("day")}${g("hour")}${g("minute")}${g("second")}`;
}

/**
 * Starts an M-Pesa STK Push for a booking.
 * The amount comes from the booking (never from the client), and only the
 * traveler who owns the booking can pay for it.
 */
async function initiateStkPush({ bookingId, phoneNumber, userId }) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) throw new AppError("Enter a valid M-Pesa phone number", 400, "INVALID_PHONE");
  if (!bookingId) throw new AppError("bookingId is required", 400, "VALIDATION_ERROR");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
  if (booking.travelerId !== userId) throw new AppError("Not authorized", 403, "NOT_AUTHORIZED");
  if (booking.status !== "PENDING_PAYMENT") {
    throw new AppError("This booking cannot be paid for", 409, "BOOKING_NOT_PAYABLE");
  }

  assertConfigured();
  const amount = Math.round(Number(booking.totalAmount));
  const accessToken = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${env.daraja.shortcode}${env.daraja.passkey}${ts}`).toString("base64");

  let data;
  try {
    const res = await axios.post(
      `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: env.daraja.shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: env.daraja.shortcode,
        PhoneNumber: phone,
        CallBackURL: env.daraja.callbackUrl,
        AccountReference: bookingId.slice(0, 8).toUpperCase(), // Daraja limit: 12 chars
        TransactionDesc: "I-Tourism", // Daraja limit: 13 chars
      },
      { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 20000 }
    );
    data = res.data;
  } catch (err) {
    logger.error("STK push failed", { status: err.response?.status, data: err.response?.data });
    throw new AppError("Could not start the M-Pesa payment. Please try again.", 502, "MPESA_UNAVAILABLE");
  }

  if (String(data.ResponseCode) !== "0" || !data.CheckoutRequestID) {
    logger.error("STK push rejected", { data });
    throw new AppError("M-Pesa rejected the request. Check the phone number and try again.", 502, "MPESA_REJECTED");
  }

  await prisma.payment.upsert({
    where: { bookingId },
    update: { amount, status: "PENDING", checkoutRequestId: data.CheckoutRequestID, resultDesc: null, mpesaReceipt: null },
    create: { bookingId, amount, status: "PENDING", checkoutRequestId: data.CheckoutRequestID },
  });

  return { status: "PENDING", message: "Check your phone and enter your M-Pesa PIN." };
}

/**
 * POST /api/payments/callback: called by Safaricom, no login.
 * Because anyone on the internet can POST here, we only act on callbacks that
 * match a PENDING payment we created (via the unguessable CheckoutRequestID)
 * and whose paid amount covers the booking.
 */
async function handleCallback(body) {
  const cb = body?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) {
    logger.error("Malformed Daraja callback payload", { body });
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: cb.CheckoutRequestID },
    include: { booking: true },
  });
  if (!payment) {
    logger.warn("Callback for unknown CheckoutRequestID", { id: cb.CheckoutRequestID });
    return;
  }
  if (payment.status !== "PENDING") return; // Safaricom retries; stay idempotent

  if (cb.ResultCode !== 0) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", resultDesc: cb.ResultDesc || "Payment not completed" },
    });
    return;
  }

  const items = cb.CallbackMetadata?.Item || [];
  const get = (name) => items.find((i) => i.Name === name)?.Value;
  const paid = Number(get("Amount"));
  const receipt = get("MpesaReceiptNumber") ? String(get("MpesaReceiptNumber")) : null;

  if (!(paid >= Number(payment.amount))) {
    logger.error("Callback amount mismatch", { expected: payment.amount, paid, receipt });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", resultDesc: "Amount mismatch", mpesaReceipt: receipt },
    });
    return;
  }

  if (payment.booking.status !== "PENDING_PAYMENT") {
    // Money arrived for a booking that expired or was cancelled meanwhile. Keep the
    // funds recorded and shout, because this needs a manual refund.
    logger.error("PAYMENT_FOR_INACTIVE_BOOKING: manual refund needed", {
      bookingId: payment.bookingId, status: payment.booking.status, receipt,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "HELD", mpesaReceipt: receipt, collectedAt: new Date(), resultDesc: "Booking inactive: refund needed" },
    });
    return;
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "HELD", mpesaReceipt: receipt, collectedAt: new Date(), resultDesc: cb.ResultDesc },
    }),
    prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } }),
  ]);

  notifyParties(payment.bookingId).catch((err) => logger.error("Notification failed", { err: err.message }));
}

async function notifyParties(bookingId) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { traveler: true, room: { include: { property: { include: { owner: true } } } } },
  });
  if (!b) return;
  const property = b.room.property;
  sms.sendBookingConfirmation(`+${b.traveler.phoneNumber}`, property.name, toDateString(b.checkIn));
  sms.sendNewBookingAlert(`+${property.owner.phoneNumber}`, b.traveler.fullName, property.name);
}

async function getPaymentStatus(bookingId, user) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, room: { include: { property: true } } },
  });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");

  const allowed =
    booking.travelerId === user.id || booking.room.property.ownerId === user.id || user.role === "ADMIN";
  if (!allowed) throw new AppError("Not authorized", 403, "NOT_AUTHORIZED");

  const p = booking.payment;
  return p
    ? { status: p.status, resultDesc: p.resultDesc, mpesaReceipt: p.mpesaReceipt }
    : { status: "NOT_STARTED" };
}

module.exports = { initiateStkPush, handleCallback, getPaymentStatus };
