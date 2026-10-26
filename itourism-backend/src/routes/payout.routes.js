const router = require("express").Router();
const payoutController = require("../controllers/payout.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/ledger", authenticate, authorize("OWNER"), payoutController.ledger);

module.exports = router;
