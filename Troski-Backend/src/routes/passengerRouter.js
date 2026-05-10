const express = require("express");
const router = express.Router();
const {
  getCurrentPassenger,
  completePassengerProfile,
} = require("../controllers/passengerController.js");
const { validateUpdatePassengerInput } = require("../middleware/validationMiddleware");

router.route("/current").get(getCurrentPassenger);
router.route("/profile").patch(validateUpdatePassengerInput, completePassengerProfile);

module.exports = router;
