const express = require("express");
const router = express.Router();
const {
  getCurrentDriver,
  getDriverVehicle,
} = require("../controllers/driverController.js");

router.route("/current").get(getCurrentDriver);
router.route("/vehicle").get(getDriverVehicle);

module.exports = router;
