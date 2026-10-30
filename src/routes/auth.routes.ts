import { Router } from "express";
import rateLimiter from "express-rate-limit";
import { authenticateUser } from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  requestSmsOtp,
  requestEmailOtp,
  registerPassenger,
  registerDriver,
  loginPassenger,
  loginDriver,
  logoutUser,
  registerAdmin,
  loginAdmin,
  googleAuth,
  requestForgotPinSmsOtp,
  requestForgotPinEmailOtp,
  forgotPinPassenger,
  forgotPinDriver,
  changePin,
  refreshUserToken,
} from "../controllers/auth.controller";
import {
  requestSmsOtpSchema,
  requestEmailOtpSchema,
  registerPassengerSchema,
  registerDriverSchema,
  loginSchema,
  registerAdminSchema,
  loginAdminSchema,
  googleAuthSchema,
  forgotPinSchema,
  changePinSchema,
} from "../validators/auth.validator";

const router = Router();

const apiLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15, // 15 minutes
  max: 15,
  message: { msg: "IP rate limit exceeded, retry in 15 minutes" },
});

const otpRequestLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15, // 15 minutes
  max: 3,
  message: {
    msg: "Too many OTP requests from this IP, please try again later",
  },
});

// Passenger App Auth
router.post(
  "/passenger/request-otp",
  otpRequestLimiter,
  validate(requestSmsOtpSchema),
  requestSmsOtp,
);
router.post(
  "/passenger/request-email-otp",
  otpRequestLimiter,
  validate(requestEmailOtpSchema),
  requestEmailOtp,
);
router.post(
  "/passenger/register",
  apiLimiter,
  validate(registerPassengerSchema),
  registerPassenger,
);
router.post(
  "/passenger/login",
  apiLimiter,
  validate(loginSchema),
  loginPassenger,
);
router.post(
  "/passenger/forgot-pin/request-otp",
  otpRequestLimiter,
  validate(requestSmsOtpSchema),
  requestForgotPinSmsOtp,
);
router.post(
  "/passenger/forgot-pin/request-email-otp",
  otpRequestLimiter,
  validate(requestEmailOtpSchema),
  requestForgotPinEmailOtp,
);
router.post(
  "/passenger/forgot-pin",
  apiLimiter,
  validate(forgotPinSchema),
  forgotPinPassenger,
);

// Driver App Auth
router.post(
  "/driver/request-otp",
  otpRequestLimiter,
  validate(requestSmsOtpSchema),
  requestSmsOtp,
);
router.post(
  "/driver/request-email-otp",
  otpRequestLimiter,
  validate(requestEmailOtpSchema),
  requestEmailOtp,
);
router.post(
  "/driver/register",
  apiLimiter,
  validate(registerDriverSchema),
  registerDriver,
);
router.post("/driver/login", apiLimiter, validate(loginSchema), loginDriver);

router.post(
  "/driver/forgot-pin/request-otp",
  otpRequestLimiter,
  validate(requestSmsOtpSchema),
  requestForgotPinSmsOtp,
);

router.post(
  "/driver/forgot-pin/request-email-otp",
  otpRequestLimiter,
  validate(requestEmailOtpSchema),
  requestForgotPinEmailOtp,
);

router.post(
  "/driver/forgot-pin",
  apiLimiter,
  validate(forgotPinSchema),
  forgotPinDriver,
);

// Admin Auth
router.post(
  "/admin/register",
  apiLimiter,
  validate(registerAdminSchema),
  registerAdmin,
);
router.post("/admin/login", apiLimiter, validate(loginAdminSchema), loginAdmin);

// Google Auth
router.post("/google", apiLimiter, validate(googleAuthSchema), googleAuth);

// Mobile / Explicit Token Refresh Route
router.post("/refresh", apiLimiter, refreshUserToken);

// Logout
router.route("/logout").delete(authenticateUser, logoutUser);

router.patch(
  "/change-pin",
  authenticateUser,
  apiLimiter,
  validate(changePinSchema),
  changePin,
);

export default router;
