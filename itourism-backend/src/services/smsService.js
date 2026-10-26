const env = require("../config/env");
const logger = require("../config/logger");

// Lazily initialized so the app can boot without AT credentials in early local dev.
let smsClient = null;
function getClient() {
  if (!smsClient) {
    const AfricasTalking = require("africastalking")({
      apiKey: env.africasTalking.apiKey,
      username: env.africasTalking.username,
    });
    smsClient = AfricasTalking.SMS;
  }
  return smsClient;
}

async function send(to, message) {
  try {
    await getClient().send({ to: [to], message });
  } catch (err) {
    // SMS failures should never crash the calling flow (e.g. a booking
    // confirmation) — log and move on.
    logger.error("SMS send failed", { to, err: err.message });
  }
}

const sendBookingConfirmation = (phone, propertyName, checkIn) =>
  send(phone, `Your booking at ${propertyName} is confirmed for ${checkIn}. Thank you for using I-Tourism.`);

const sendNewBookingAlert = (ownerPhone, guestName, propertyName) =>
  send(ownerPhone, `New booking: ${guestName} has booked a room at ${propertyName}.`);

const sendPayoutConfirmation = (ownerPhone, amount) =>
  send(ownerPhone, `Payout of KES ${amount} has been sent to your M-Pesa.`);

const sendPayoutDelayedNotice = (ownerPhone) =>
  send(ownerPhone, `Your payout is delayed due to a temporary issue. We are retrying and will update you shortly.`);

module.exports = {
  send,
  sendBookingConfirmation,
  sendNewBookingAlert,
  sendPayoutConfirmation,
  sendPayoutDelayedNotice,
};
