const express = require("express");

const router = express.Router();
const rateLimiter = require("express-rate-limit");

const {
  // User (passenger + driver share this)
  userSignUp,
  verifySignUpOTP,
  completeProfile,
  verifyPin,
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
  validateCompleteProfileInput,
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
router.patch(
  "/complete-profile",
  authenticateUser,
  upload.single("profilePhoto"),
  validateCompleteProfileInput,
  completeProfile,
);
router.post("/verify-pin", authenticateUser, validatePinInput, verifyPin);
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
