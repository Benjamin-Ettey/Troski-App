const express = require("express");
const router = express.Router();
const {
  getCurrentDriver,
  getDriverVehicle,
  updateLocation,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
} = require("../controllers/driverController.js");

router.route("/current").get(getCurrentDriver);
router.route("/vehicle").get(getDriverVehicle);
router.route("/location").patch(updateLocation);

// Ride management
router.route("/rides/:rideId/accept").patch(acceptRide);
router.route("/rides/:rideId/start").patch(startRide);
router.route("/rides/:rideId/complete").patch(completeRide);
router.route("/rides/:rideId/cancel").patch(cancelRide);

module.exports = router;
