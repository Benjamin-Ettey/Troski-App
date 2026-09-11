const express = require("express");
const router = express.Router();

const {
  // passenger
  searchTrips,
  requestSeat,
  getMyActiveBooking,
  cancelMyBooking,
  confirmBoarding,
  // driver
  getMyActiveTrip,
  listIncomingRequests,
  acceptBooking,
  rejectBooking,
  markBoarded,
} = require("../controllers/tripController");

const {
  authenticateUser,
  requireRole,
  requireOnboardingComplete,
} = require("../middleware/authMiddleware");

const { validateIdParam } = require("../middleware/validationMiddleware");

// Every trip endpoint requires a fully-onboarded user.
const userChain = [authenticateUser, requireOnboardingComplete];
const driverChain = [
  authenticateUser,
  requireOnboardingComplete,
  requireRole("driver"),
];

// ============================================================
// PASSENGER (Mode B — see trotros on map, request seat, confirm boarding)
// ============================================================

// Search trotros whose route covers my pickup → drop-off (no live position
// returned; that's revealed only after a driver accepts).
router.post("/search", ...userChain, searchTrips);

// Request a seat on a specific trip (the one I tapped)
router.post("/:id/request-seat", ...userChain, validateIdParam, requestSeat);

// My current booking + driver info + ETA
router.get("/my-booking", ...userChain, getMyActiveBooking);

// Cancel my booking (refunds escrow)
router.patch("/booking/cancel", ...userChain, cancelMyBooking);

// I'm in the trotro — enter the 4-digit code to confirm boarding
router.post("/booking/confirm-boarding", ...userChain, confirmBoarding);

// ============================================================
// DRIVER
// ============================================================

// My active trip (with seats + bookings)
router.get("/my-trip", ...driverChain, getMyActiveTrip);

// Pending booking requests waiting for my decision
router.get("/incoming-requests", ...driverChain, listIncomingRequests);

// Accept a pending booking — issues the 4-digit code
router.patch(
  "/booking/:id/accept",
  ...driverChain,
  validateIdParam,
  acceptBooking,
);

// Reject a pending booking — refunds the passenger
router.patch(
  "/booking/:id/reject",
  ...driverChain,
  validateIdParam,
  rejectBooking,
);

// Fallback: I'm letting them board even though they can't enter the code
router.patch(
  "/booking/:id/mark-boarded",
  ...driverChain,
  validateIdParam,
  markBoarded,
);

module.exports = router;
