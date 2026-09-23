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

// Logout
router.route("/logout").delete(authenticateUser, logoutUser);

export default router;
