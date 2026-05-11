const express = require("express");

const router = express.Router();

const rateLimiter = require("express-rate-limit");

const {
  signUp,
  requestOTP,
  verifyOTP,
  logout,
} = require("../controllers/authController");

const {
  validateSignUpInput,
  validateRequestOtpInput,
  validateVerifyOtpInput,
  validateVehicleRegistrationInput,
} = require("../middleware/validationMiddleware");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authMiddleware");

const { upload } = require("../middleware/multerMiddleware");

const requestOtpAPILimiter = rateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 3,
  message: {
    msg: "Too many OTP requests. Please try again later",
  },
});

const verifyOtpAPILimiter = rateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 5,
  message: {
    msg: "Too many invalid OTP attempts. Please request a new code",
  },
});

router.route("/sign-up").post(
  upload.fields([
    { name: "licenseImage", maxCount: 1 },
    { name: "ghanaCardImage", maxCount: 1 },
  ]),
  validateSignUpInput,
  signUp,
);

router
  .route("/request-otp")
  .post(requestOtpAPILimiter, validateRequestOtpInput, requestOTP);

router
  .route("/verify-otp")
  .post(verifyOtpAPILimiter, validateVerifyOtpInput, verifyOTP);

router.route("/logout").delete(authenticateUser, logout);

module.exports = router;
