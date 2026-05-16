const express = require("express");
const router = express.Router();

const {
  requestRide,
  getMyActiveBooking,
  cancelBooking,
  listAvailableTrips,
  acceptTrip,
  markArrivedAtPickup,
  startTrip,
  completeTrip,
  cancelTripByDriver,
} = require("../controllers/tripController");

const {
  authenticateUser,
  requireRole,
} = require("../middleware/authMiddleware");

const { validateIdParam } = require("../middleware/validationMiddleware");

// ----- PASSENGER routes (any logged-in user can book; they're a passenger by default) -----
router.post("/request", authenticateUser, requestRide);
router.get("/my-booking", authenticateUser, getMyActiveBooking);
router.patch("/booking/cancel", authenticateUser, cancelBooking);

// ----- DRIVER routes -----
router.get(
  "/available",
  authenticateUser,
  requireRole("driver"),
  listAvailableTrips,
);
router.patch(
  "/:id/accept",
  authenticateUser,
  requireRole("driver"),
  validateIdParam,
  acceptTrip,
);
router.patch(
  "/:id/arrived",
  authenticateUser,
  requireRole("driver"),
  validateIdParam,
  markArrivedAtPickup,
);
router.patch(
  "/:id/start",
  authenticateUser,
  requireRole("driver"),
  validateIdParam,
  startTrip,
);
router.patch(
  "/:id/complete",
  authenticateUser,
  requireRole("driver"),
  validateIdParam,
  completeTrip,
);
router.patch(
  "/:id/cancel",
  authenticateUser,
  requireRole("driver"),
  validateIdParam,
  cancelTripByDriver,
);

module.exports = router;
