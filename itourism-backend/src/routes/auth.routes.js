const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/authenticate");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

module.exports = router;
