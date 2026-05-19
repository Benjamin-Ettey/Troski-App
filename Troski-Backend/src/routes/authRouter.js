const express = require("express");
const router = express.Router();
const rateLimiter = require("express-rate-limit");

const {
  // User
  userSignUp,
  verifySignUpOTP,
  setPin,
  confirmPin,
  login,
  verifyPin,
  completeProfile,
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
  requireSignupSession,
  requireSuperAdmin,
} = require("../middleware/authMiddleware");

const { upload } = require("../middleware/multerMiddleware");

// ---------- RATE LIMITERS ----------
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
// PIN login is brute-force-able since PIN is 6 digits. Tight per-IP cap +
// short window keeps it from being scriptable.
const loginLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 10,
  message: {
    msg: "Too many login attempts. Please wait 15 minutes and try again.",
  },
});
const adminLoginLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15,
  max: 10,
  message: { msg: "Too many login attempts. Please try again later" },
});

// ============================================================
// USER (passengers + drivers — same endpoints)
// Flow:
//   POST /sign-up                 { name, phoneNumber, email }
//   POST /verify-signup-otp       { phoneNumber, otpCode }     -> sets signup-session
//   POST /set-pin                 { pinCode }                   (signup-session)
//   POST /confirm-pin             { pinCode }                   (signup-session)
//                                                                -> real session cookies
//   POST /login                   { phoneNumber, pinCode }     -> real session cookies
//   PATCH /complete-profile       { dateOfBirth, profilePhoto }
//   POST /verify-pin              { pinCode }                   (gates in-app actions)
//   DELETE /logout
// ============================================================
router.post("/sign-up", signUpLimiter, validateUserSignUpInput, userSignUp);
router.post(
  "/verify-signup-otp",
  otpVerifyLimiter,
  validateVerifyOtpInput,
  verifySignUpOTP,
);
router.post("/set-pin", requireSignupSession, validatePinInput, setPin);
router.post("/confirm-pin", requireSignupSession, validatePinInput, confirmPin);
router.post("/login", loginLimiter, validateLoginInput, login);

router.patch(
  "/complete-profile",
  authenticateUser,
  upload.single("profilePhoto"),
  validateCompleteProfileInput,
  completeProfile,
);
router.post("/verify-pin", authenticateUser, validatePinInput, verifyPin);
router.delete("/logout", authenticateUser, userLogout);

// ============================================================
// ADMIN
// First super_admin is seeded via src/scripts/seedSuperAdmin.js.
// All further admins must be invited.
// ============================================================
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
