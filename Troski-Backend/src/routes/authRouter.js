const express = require("express");
const router = express.Router();
const rateLimiter = require("express-rate-limit");

const {
  // User (passenger + driver share this)
  userSignUp,
  verifySignUpOTP,
  uploadPhoto,
  verifyPin,
  forgotPinStart,
  forgotPinReset,
  requestLoginOTP,
  verifyLoginOTP,
  userLogout,

  // Admin
  inviteAdmin,
  verifyAdminInvite,
  registerAdminWithInvite,
  listAdminInvites,
  revokeAdminInvite,
  adminLogin,
  adminLogout,
} = require("../controllers/authController");

const {
  validateUserSignUpInput,
  validateLoginInput,
  validateVerifyOtpInput,
  validatePinInput,
  validateAdminInviteInput,
  validateAdminRegisterInput,
} = require("../middleware/validationMiddleware");

const {
  authenticateUser,
  authenticateAdmin,
  requireSuperAdmin,
} = require("../middleware/authMiddleware");

const { upload } = require("../middleware/multerMiddleware");

// ---------- RATE LIMITERS ----------
const otpRequestLimiter = rateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 3,
  message: { msg: "Too many OTP requests. Please try again later" },
});
const otpVerifyLimiter = rateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 5,
  message: { msg: "Too many invalid OTP attempts. Please request a new code" },
});
const signUpLimiter = rateLimiter({
  windowMs: 1000 * 60 * 10,
  max: 3,
  message: { msg: "Too many sign-up attempts. Please try again later" },
});
const adminLoginLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 10,
  message: { msg: "Too many login attempts. Please try again later" },
});

// ============================================================
// USER ROUTES (passengers + drivers — same endpoints)
// ============================================================
router.post("/sign-up", signUpLimiter, validateUserSignUpInput, userSignUp);
router.post(
  "/verify-signup-otp",
  otpVerifyLimiter,
  validateVerifyOtpInput,
  verifySignUpOTP,
);
// REQUIRED onboarding photo upload. Frontend calls this right after the
// user finishes OTP/PIN setup. Flips isOnboardingComplete=true on success,
// after which the rest of the app becomes usable.
router.post(
  "/upload-photo",
  authenticateUser,
  upload.single("profilePhoto"),
  uploadPhoto,
);

router.post("/verify-pin", authenticateUser, validatePinInput, verifyPin);

// Forgot PIN — unauthenticated. Both endpoints rate-limited tighter than
// regular OTP request to discourage spam / enumeration attacks.
const forgotPinStartLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15, // 15 min
  max: 3,
  message: { msg: "Too many reset attempts. Try again later." },
});
const forgotPinResetLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 5,
  message: { msg: "Too many invalid reset attempts. Request a new OTP." },
});
router.post("/forgot-pin/start", forgotPinStartLimiter, forgotPinStart);
router.post("/forgot-pin/reset", forgotPinResetLimiter, forgotPinReset);

router.post(
  "/request-otp",
  otpRequestLimiter,
  validateLoginInput,
  requestLoginOTP,
);
router.post(
  "/verify-otp",
  otpVerifyLimiter,
  validateVerifyOtpInput,
  verifyLoginOTP,
);
router.delete("/logout", authenticateUser, userLogout);

// ============================================================
// ADMIN ROUTES
// ============================================================
// First super_admin is seeded via src/scripts/seedSuperAdmin.js.
// All further admins must be invited.

router
  .route("/admin/invite")
  .post(
    authenticateAdmin,
    requireSuperAdmin,
    validateAdminInviteInput,
    inviteAdmin,
  )
  .get(authenticateAdmin, requireSuperAdmin, listAdminInvites);

router.get("/admin/invite/verify", verifyAdminInvite);

router.delete(
  "/admin/invite/:id",
  authenticateAdmin,
  requireSuperAdmin,
  revokeAdminInvite,
);

router.post(
  "/admin/register-with-invite",
  validateAdminRegisterInput,
  registerAdminWithInvite,
);

router.post("/admin/login", adminLoginLimiter, adminLogin);
router.delete("/admin/logout", authenticateAdmin, adminLogout);

module.exports = router;
