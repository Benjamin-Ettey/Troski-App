const express = require("express");
const router = express.Router();

const {
  goOnline,
  goOffline,
  updateLocation,
} = require("../controllers/driverLocationController");

const {
  authenticateUser,
  requireRole,
} = require("../middleware/authMiddleware");

router.post("/online", authenticateUser, requireRole("driver"), goOnline);
router.post("/offline", authenticateUser, requireRole("driver"), goOffline);
router.post("/update", authenticateUser, requireRole("driver"), updateLocation);

module.exports = router;
