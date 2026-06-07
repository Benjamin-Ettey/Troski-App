const express = require("express");
const router = express.Router();

const {
  getCurrentPassenger,
  getRideHistory,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  changeUsername,
  changePin,
  startChangeEmail,
  verifyChangeEmail,
  startChangePhone,
  verifyChangePhone,
} = require("../controllers/passengerController.js");

// Profile
router.get("/current", getCurrentPassenger);

// Activity feeds
router.get("/ride-history", getRideHistory);
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.post("/notifications/mark-all-read", markAllNotificationsRead);

// Profile edits — three security tiers (auth handled by the
// authenticatePassenger middleware mounted at /api/v1/passenger in
// server.js, so every route below is already authenticated).
//
//   Tier 1: just authenticated
router.patch("/me/username", changeUsername);

//   Tier 2: current PIN required
router.post("/me/change-pin", changePin);

//   Tier 3: current PIN + OTP to the new address
router.post("/me/change-email/start", startChangeEmail);
router.post("/me/change-email/verify", verifyChangeEmail);
router.post("/me/change-phone/start", startChangePhone);
router.post("/me/change-phone/verify", verifyChangePhone);

module.exports = router;
