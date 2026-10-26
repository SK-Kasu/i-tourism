const router = require("express").Router();
const propertyController = require("../controllers/property.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/", propertyController.search);            // public — GET /api/properties?region=&checkIn=&checkOut=
router.get("/mine", authenticate, authorize("OWNER"), propertyController.mine); // before /:id
router.get("/:id", propertyController.getById);         // public
router.post("/", authenticate, authorize("OWNER"), propertyController.create);
router.put("/:id", authenticate, authorize("OWNER"), propertyController.update);

module.exports = router;
