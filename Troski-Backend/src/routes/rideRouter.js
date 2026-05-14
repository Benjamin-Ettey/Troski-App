const express = require("express");

const router = express.Router();

const {
  estimateRideFare,
  requestRide,
  updateDriverLocation,
  cancelRide,
  requestRideCompletion,
  confirmRideCompletion,
  acceptRide,
} = require("../controllers/rideController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authMiddleware");

router.route("/estimate").post(estimateRideFare);

router
  .route("/request")
  .post(authenticateUser, authorizePermissions("passenger"), requestRide);

router
  .route("/accept/:rideId")
  .patch(authenticateUser, authorizePermissions("driver"), acceptRide);

router
  .route("/driver-location")
  .patch(
    authenticateUser,
    authorizePermissions("driver"),
    updateDriverLocation,
  );

router
  .route("/cancel/:rideId")
  .patch(authenticateUser, authorizePermissions("passenger"), cancelRide);

router
  .route("/request-completion")
  .patch(
    authenticateUser,
    authorizePermissions("driver"),
    requestRideCompletion,
  );

router
  .route("/confirm-completion")
  .patch(
    authenticateUser,
    authorizePermissions("passenger"),
    confirmRideCompletion,
  );

module.exports = router;
