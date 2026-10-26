const router = require("express").Router();
const bookingController = require("../controllers/booking.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.post("/", authenticate, authorize("TRAVELER"), bookingController.create);
router.get("/my", authenticate, authorize("TRAVELER"), bookingController.myBookings);
router.get("/owner", authenticate, authorize("OWNER"), bookingController.ownerBookings); // before /:id
router.get("/:id", authenticate, bookingController.getById);
router.put("/:id/cancel", authenticate, authorize("TRAVELER"), bookingController.cancel);

module.exports = router;
