const express = require("express");
const router = express.Router();
const {
  requestPassengerOTP,
  verifyPassengerOTP,
  passengerLogout,
  requestDriverOTP,
  verifyDriverOTP,
  completeDriverProfile,
  driverLogout,
  vehicleRegistration,
  checkPlateNumber,
  adminSignUp,
  adminLogin,
  adminLogout,
} = require("../controllers/authController");

const {
  validateLoginInput,
  validateVerifyOtpInput,
  validateDriverCompleteProfileInput,
  validateVehicleRegistrationInput,
} = require("../middleware/validationMiddleware");

const {
  authenticatePassenger,
  authenticateDriver,
  authenticateAdmin,
} = require("../middleware/authMiddleware");

const rateLimiter = require("express-rate-limit");
const { upload } = require("../middleware/multerMiddleware");

const requestOtpAPILimiter = rateLimiter({
  windowMs: 1000 * 60 * 10, // 10 mins
  max: 3,
  message: { msg: "Too many OTP requests. Please try again later" },
});

const verifyOtpAPILimiter = rateLimiter({
  windowMs: 1000 * 60 * 10, // 10 mins
  max: 5,
  message: { msg: "Too many invalid OTP attempts. Please request a new code" },
});

// ─── Passenger ───────────────────────────────────────────────────────────────
router
  .route("/passenger/request-otp")
  .post(requestOtpAPILimiter, validateLoginInput, requestPassengerOTP);

router
  .route("/passenger/verify-otp")
  .post(verifyOtpAPILimiter, validateVerifyOtpInput, verifyPassengerOTP);

router
  .route("/passenger/logout")
  .delete(authenticatePassenger, passengerLogout);

// ─── Driver ──────────────────────────────────────────────────────────────────
router
  .route("/driver/request-otp")
  .post(requestOtpAPILimiter, validateLoginInput, requestDriverOTP);

router
  .route("/driver/verify-otp")
  .post(verifyOtpAPILimiter, validateVerifyOtpInput, verifyDriverOTP);

// Complete profile after OTP: upload license + Ghana card + fill in details
router.route("/driver/complete-profile").post(
  authenticateDriver,
  upload.fields([
    { name: "licenseImage", maxCount: 1 },
    { name: "ghanaCardImage", maxCount: 1 },
  ]),
  validateDriverCompleteProfileInput,
  completeDriverProfile
);

router.route("/driver/logout").delete(authenticateDriver, driverLogout);

// ─── Vehicle ─────────────────────────────────────────────────────────────────
router.route("/vehicle/register").post(
  authenticateDriver,
  upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "insuranceCertImage", maxCount: 1 },
    { name: "vehicleRegDocImage", maxCount: 1 },
    { name: "DVLARoadworthyImage", maxCount: 1 },
  ]),
  validateVehicleRegistrationInput,
  vehicleRegistration
);

router.route("/vehicle/check-plate-number").post(checkPlateNumber);

// ─── Admin ───────────────────────────────────────────────────────────────────
router.route("/admin/sign-up").post(adminSignUp);
router.route("/admin/login").post(adminLogin);
router.route("/admin/logout").delete(authenticateAdmin, adminLogout);

module.exports = router;
