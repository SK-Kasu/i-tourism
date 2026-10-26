const axios = require("axios");
const prisma = require("../lib/prisma");
const env = require("../config/env");
const logger = require("../config/logger");
const smsService = require("./smsService");

const DARAJA_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

/**
 * Processes payout for a single checked-out, paid booking: calculates
 * commission, calls the Daraja B2C endpoint, records the Payout row, and
 * notifies the owner. See technical documentation Section 6.2-6.5.
 */
async function processPayout(booking) {
  const grossAmount = Number(booking.totalAmount);
  const commissionAmount = +(grossAmount * env.commissionRate).toFixed(2);
  const netPayout = +(grossAmount - commissionAmount).toFixed(2);
  const ownerId = booking.room.property.ownerId;

  const payout = await prisma.payout.create({
    data: { bookingId: booking.id, ownerId, grossAmount, commissionAmount, netPayout, status: "PENDING" },
  });

  try {
    await sendB2C(booking.room.property.owner.phoneNumber, netPayout, booking.id);
    await prisma.payout.update({ where: { id: payout.id }, data: { status: "PAID", paidAt: new Date() } });
    await smsService.sendPayoutConfirmation(booking.room.property.owner.phoneNumber, netPayout);
  } catch (err) {
    logger.error("B2C payout failed", { bookingId: booking.id, err: err.message });
    await prisma.payout.update({ where: { id: payout.id }, data: { status: "FAILED" } });
    await smsService.sendPayoutDelayedNotice(booking.room.property.owner.phoneNumber);
    // A retry queue (e.g. re-attempt on the next cron run, capped at N attempts)
    // should be added here before this goes to production.
  }
}

async function sendB2C(phoneNumber, amount, bookingId) {
  const accessToken = await getAccessToken();
  const payload = {
    InitiatorName: "testapi", // replace with your registered initiator once live
    SecurityCredential: "", // encrypted credential from Safaricom — see Daraja docs
    CommandID: "BusinessPayment",
    Amount: Math.round(amount),
    PartyA: env.daraja.shortcode,
    PartyB: phoneNumber,
    Remarks: `I-Tourism payout for booking ${bookingId}`,
    QueueTimeOutURL: env.daraja.callbackUrl,
    ResultURL: env.daraja.callbackUrl,
    Occasion: "Payout",
  };

  return axios.post(`${DARAJA_BASE_URL}/mpesa/b2c/v1/paymentrequest`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function getAccessToken() {
  const auth = Buffer.from(`${env.daraja.consumerKey}:${env.daraja.consumerSecret}`).toString("base64");
  const res = await axios.get(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.data.access_token;
}

async function getLedger(ownerId) {
  return prisma.payout.findMany({
    where: { ownerId },
    include: { booking: { include: { room: { include: { property: true } } } } },
    orderBy: { id: "desc" },
  });
}

module.exports = { processPayout, getLedger };
