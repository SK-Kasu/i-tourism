const paymentService = require("../services/paymentService");
const logger = require("../config/logger");

async function initiate(req, res, next) {
  try {
    const { bookingId, phoneNumber } = req.body;
    const result = await paymentService.initiateStkPush({ bookingId, phoneNumber, userId: req.user.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function callback(req, res) {
  try {
    await paymentService.handleCallback(req.body);
  } catch (err) {
    logger.error("Error processing Daraja callback", { err: err.message });
  }
  // Safaricom expects a fast 200 regardless of internal outcome, or it will retry.
  res.sendStatus(200);
}

async function status(req, res, next) {
  try {
    res.json(await paymentService.getPaymentStatus(req.params.bookingId, req.user));
  } catch (err) {
    next(err);
  }
}

module.exports = { initiate, callback, status };
