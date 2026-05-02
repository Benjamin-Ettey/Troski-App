const express = require("express");
const router = express.Router();
const {
  passengerSignUp,
  requestPassengerOTP,
  verifyPassengerOTP,
  requestDriverOTP,
  verifyDriverOTP,
  driverSignUp,
  adminSignUp,
  adminLogin,
  adminLogout,
  vehicleRegistration,
  passengerLogout,
  driverLogout,
  checkPlateNumber,
  createPassengerPinCode,
  createDriverPinCode,
} = require("../controllers/authController");

const {
  validatePassengerSignUpInput,
  validateDriverSignUpInput,
  validateCreatePinInput,
  validateLoginInput,
  validateVerifyOtpInput,
  validateVehicleRegistrationInput,
} = require("../middleware/validationMiddleware");

const {
  authenticatePassenger,
  authenticateDriver,
  authenticateAdmin,
} = require("../middleware/authMiddleware");
const rateLimiter = require("express-rate-limit");

const requestOtpAPILimiter = rateLimiter({
  windowMs: 1000 * 60 * 10, //10 mins
  max: 3,
  message: {
    msg: "Too many OTP requests. Please try again later",
  },
});

const verifyOtpAPILimiter = rateLimiter({
  windowMs: 1000 * 60 * 10, //10 mins
  max: 5,
  message: {
    msg: "Too many invalid OTP attempts. Please request a new code",
  },
});

router
  .route("/passenger/sign-up")
  .post(validatePassengerSignUpInput, passengerSignUp);
router
  .route("/passenger/create-pin")
  .post(authenticatePassenger, validateCreatePinInput, createPassengerPinCode);
router
  .route("/passenger/request-otp")
  .post(requestOtpAPILimiter, validateLoginInput, requestPassengerOTP);
router
  .route("/passenger/verify-otp")
  .post(verifyOtpAPILimiter, validateVerifyOtpInput, verifyPassengerOTP);
router
  .route("/passenger/logout")
  .delete(authenticatePassenger, passengerLogout);

router.route("/driver/sign-up").post(validateDriverSignUpInput, driverSignUp);
router
  .route("/driver/create-pin")
  .post(authenticateDriver, validateCreatePinInput, createDriverPinCode);
router
  .route("/driver/request-otp")
  .post(requestOtpAPILimiter, validateLoginInput, requestDriverOTP);
router
  .route("/driver/verify-otp")
  .post(verifyOtpAPILimiter, validateVerifyOtpInput, verifyDriverOTP);
router.route("/driver/logout").delete(authenticateDriver, driverLogout);

router.route("/vehicle/register").post(authenticateDriver, validateVehicleRegistrationInput, vehicleRegistration);
router.route("/vehicle/check-plate-number").post(checkPlateNumber);

router.route("/admin/sign-up").post(adminSignUp);
router.route("/admin/login").post(adminLogin);
router.route("/admin/logout").delete(authenticateAdmin, adminLogout);

module.exports = router;
