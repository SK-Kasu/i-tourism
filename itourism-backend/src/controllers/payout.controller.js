const payoutService = require("../services/payoutService");

async function ledger(req, res, next) {
  try {
    const entries = await payoutService.getLedger(req.user.id);
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

module.exports = { ledger };
