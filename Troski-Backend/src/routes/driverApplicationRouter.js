const express = require("express");
const router = express.Router();

const {
  submitApplication,
  getMyApplication,
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
} = require("../controllers/driverApplicationController");

const {
  authenticateUser,
  authenticateAdmin,
} = require("../middleware/authMiddleware");

const {
  validateDriverApplicationInput,
  validateRejectApplicationInput,
  validateIdParam,
} = require("../middleware/validationMiddleware");

const { upload } = require("../middleware/multerMiddleware");

// ---------- USER-FACING ----------
router.post(
  "/",
  authenticateUser,
  upload.fields([
    { name: "ghanaCardImage", maxCount: 1 },
    { name: "licenseImage", maxCount: 1 },
  ]),
  validateDriverApplicationInput,
  submitApplication,
);
router.get("/me", authenticateUser, getMyApplication);

// ---------- ADMIN-FACING ----------
router.get("/admin", authenticateAdmin, listApplications);
router.get("/admin/:id", authenticateAdmin, validateIdParam, getApplication);
router.patch(
  "/admin/:id/approve",
  authenticateAdmin,
  validateIdParam,
  approveApplication,
);
router.patch(
  "/admin/:id/reject",
  authenticateAdmin,
  validateIdParam,
  validateRejectApplicationInput,
  rejectApplication,
);

module.exports = router;
