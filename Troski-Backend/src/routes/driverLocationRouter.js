const express = require("express");
const router = express.Router();

const {
  goOnline,
  goOffline,
  updateLocation,
  addWalkOn,
  removeWalkOn,
} = require("../controllers/driverLocationController");

const {
  authenticateUser,
  requireRole,
  requireOnboardingComplete,
} = require("../middleware/authMiddleware");

// Every endpoint here is a driver-only action. We chain:
//   authenticateUser → requireOnboardingComplete → requireRole("driver")
// so non-onboarded users get a clear "finish onboarding" error before
// they hit the role check.
const driverChain = [
  authenticateUser,
  requireOnboardingComplete,
  requireRole("driver"),
];

// Session lifecycle
router.post("/online", ...driverChain, goOnline);
router.post("/offline", ...driverChain, goOffline);

// Live location push (HTTP fallback; sockets preferred)
router.post("/update", ...driverChain, updateLocation);

// Walk-on counter (cash passengers picked up off the street)
router.post("/walkon/add", ...driverChain, addWalkOn);
router.post("/walkon/remove", ...driverChain, removeWalkOn);

module.exports = router;
