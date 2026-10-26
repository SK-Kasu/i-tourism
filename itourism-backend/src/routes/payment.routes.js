const router = require("express").Router();
const paymentController = require("../controllers/payment.controller");
const authenticate = require("../middleware/authenticate");

router.post("/initiate", authenticate, paymentController.initiate);
router.post("/callback", paymentController.callback); // no auth — called by Safaricom directly
router.get("/status/:bookingId", authenticate, paymentController.status);

module.exports = router;
