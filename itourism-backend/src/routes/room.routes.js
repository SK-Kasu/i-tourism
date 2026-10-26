const router = require("express").Router();
const roomController = require("../controllers/room.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.post("/:propertyId/rooms", authenticate, authorize("OWNER"), roomController.addRoom);
router.put("/:id", authenticate, authorize("OWNER"), roomController.updateRoom);
router.put("/:id/availability", authenticate, authorize("OWNER"), roomController.setAvailability);
router.get("/:id/calendar", authenticate, authorize("OWNER"), roomController.getCalendar);
router.get("/:id", roomController.getRoom); // public
router.get("/:id/availability", roomController.getAvailability); // public

module.exports = router;
