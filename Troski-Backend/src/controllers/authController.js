// ============================================================
// AUTH CONTROLLER
//
// Unified user model: passengers and drivers share one collection ("Passenger"
// — kept that name to avoid breaking other refs, but it's the User collection).
// Roles are tracked in user.roles. Everyone starts as ["passenger"]. Adding
// "driver" happens only via an approved DriverApplication, reviewed by an
// admin.
//
// Admin auth is separate (different collection, password-based, invite-only).
// ============================================================

const Passenger = require("../models/passengers"); // = User
const Admin = require("../models/admins");
const AdminInvite = require("../models/adminInvite");
const PassengerToken = require("../models/passengerToken"); // = UserToken
const AdminToken = require("../models/adminToken");

const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary");

const {
  attachPassengerCookiesToResponse,
  attachAdminCookiesToResponse,
  attachSignupSessionCookie,
  clearSignupSessionCookie,
} = require("../utils/tokenUtils");
const { sendOTPEmail } = require("../utils/sendOTPEmail");
const { sendOTPSMS } = require("../utils/sendOTPSMS");
const createHash = require("../utils/createHash");
const createTokenPassenger = require("../utils/createTokenPassenger");
const createTokenAdmin = require("../utils/createTokenAdmin");
const { formatImage } = require("../middleware/multerMiddleware");

// ============================================================
// USER SIGN-UP (4 STEPS)
//   1. /sign-up               { name, phoneNumber, email }
//   2. /verify-signup-otp     { phoneNumber, otpCode }
//        → sets short-lived `signupSession` cookie
//   3. /set-pin               { pinCode }     (signup-session required)
//   4. /confirm-pin           { pinCode }     (signup-session required)
//        → account is created; real access/refresh cookies issued
// ============================================================

// STEP 1 — collect identity. No PIN yet; OTP gets sent.
// Continuation: if a user exists for this phone but PIN isn't set yet, we
// reuse the row and resend an OTP (resetting phone-verified state so they
// have to re-verify).
const userSignUp = async (req, res) => {
  const { phoneNumber, email, name } = req.body;

  const existing = await Passenger.findOne({ phoneNumber });
  if (existing && existing.pinCode) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "An account with this phone number already exists. Please log in.",
    });
  }

  let user;
  if (existing) {
    existing.name = name;
    existing.email = email;
    existing.isPhoneVerified = false;
    existing.pendingPinCode = null;
    user = existing;
  } else {
    user = new Passenger({
      name,
      phoneNumber,
      email,
      roles: ["passenger"],
      isPhoneVerified: false,
      isProfileComplete: false,
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.otpCode = createHash(otpCode);
  user.otpExpiresAt = new Date(Date.now() + 1000 * 60 * 5);
  await user.save();

  const method = (req.body.method || "sms").toLowerCase();
  if (method === "email") {
    await sendOTPEmail({ email: user.email, otpCode });
  } else {
    await sendOTPSMS({ phoneNumber: user.phoneNumber, otpCode });
  }

  res.status(StatusCodes.CREATED).json({
    msg: "Sign-up started. OTP sent for verification.",
    phoneNumber: user.phoneNumber,
    nextStep: "verify-signup-otp",
  });
};

// STEP 2 — verify the OTP. We don't issue a real session here, just a
// short-lived `signupSession` cookie that authenticates /set-pin and
// /confirm-pin. The account isn't usable until PIN confirmation.
const verifySignUpOTP = async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  const user = await Passenger.findOne({ phoneNumber });
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Sign-up not started for this phone number" });
  }
  if (user.pinCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Account already created. Please log in." });
  }
  if (!user.otpCode || !user.otpExpiresAt) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No OTP request found. Please restart sign-up." });
  }
  if (user.otpExpiresAt < new Date()) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "OTP has expired" });
  }
  if (createHash(otpCode) !== user.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid OTP" });
  }

  user.otpCode = null;
  user.otpExpiresAt = null;
  user.isPhoneVerified = true;
  await user.save();

  attachSignupSessionCookie({
    res,
    signupPayload: {
      userId: user._id,
      phoneNumber: user.phoneNumber,
      stage: "post-otp",
    },
  });

  res.status(StatusCodes.OK).json({
    msg: "Phone verified. Please set your PIN.",
    nextStep: "set-pin",
  });
};

// STEP 3 — store a freshly-set PIN (hashed) into pendingPinCode.
// Requires the signupSession cookie. Does NOT issue a real session yet —
// the user has to type the PIN again at /confirm-pin to prove it wasn't
// a typo.
const setPin = async (req, res) => {
  const { pinCode } = req.body;
  const { userId } = req.signupUser;

  const user = await Passenger.findById(userId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!user.isPhoneVerified) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Verify your phone number first" });
  }
  if (user.pinCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "PIN already set. Please log in instead." });
  }

  // Hash manually + write via updateOne so the pre('save') hook (which
  // only watches `pinCode`) doesn't fire on the temporary field.
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(pinCode, salt);
  await Passenger.updateOne(
    { _id: user._id },
    { $set: { pendingPinCode: hashed } },
  );

  res.status(StatusCodes.OK).json({
    msg: "PIN recorded. Please confirm by entering it again.",
    nextStep: "confirm-pin",
  });
};

// STEP 4 — confirm the PIN matches what was set at /set-pin. On match:
// promote the pending PIN to the real one, clear the signup-session, and
// issue real access/refresh cookies. The account is fully created.
const confirmPin = async (req, res) => {
  const { pinCode } = req.body;
  const { userId } = req.signupUser;

  const user = await Passenger.findById(userId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!user.pendingPinCode) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "No PIN to confirm. Please set a PIN first.",
    });
  }

  const ok = await bcrypt.compare(pinCode, user.pendingPinCode);
  if (!ok) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: "PIN does not match. Please re-enter the same PIN you just created.",
    });
  }

  // Promote pendingPinCode -> pinCode via updateOne so the pre('save')
  // hook doesn't re-hash the already-hashed value.
  await Passenger.updateOne(
    { _id: user._id },
    {
      $set: { pinCode: user.pendingPinCode },
      $unset: { pendingPinCode: 1 },
    },
  );

  // Reload the user with the new state for token issuance
  const updatedUser = await Passenger.findById(userId);

  clearSignupSessionCookie(res);
  await issueUserSession(req, res, updatedUser, {
    msg: "Account created. Welcome to Troski!",
    nextStep: "complete-profile",
  });
};

// STEP 3 — complete-profile: profile photo (file) + date of birth.
// Authenticated.
const completeProfile = async (req, res) => {
  const user = await Passenger.findById(req.user.passengerId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!user.isPhoneVerified) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Verify your phone number first" });
  }

  const { dateOfBirth } = req.body;
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid date of birth" });
    }
    user.dateOfBirth = dob;
  }

  // Optional profile photo (multipart "profilePhoto" field)
  if (req.file) {
    try {
      const formatted = formatImage(req.file);
      const uploaded = await cloudinary.v2.uploader.upload(formatted, {
        use_filename: true,
        folder: "/Troski/Troski-Profile-Photos",
      });
      // Clean up any previous photo
      if (user.profilePhotoPublicId) {
        cloudinary.v2.uploader
          .destroy(user.profilePhotoPublicId)
          .catch((e) => console.error("Failed deleting old profile photo", e));
      }
      user.profilePhoto = uploaded.secure_url;
      user.profilePhotoPublicId = uploaded.public_id;
    } catch (e) {
      console.error(e);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "Profile photo upload failed" });
    }
  }

  user.isProfileComplete = true;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: "Profile completed", user });
};

// PIN gate — used to authorize sensitive actions (wallet ops, withdrawals…).
const verifyPin = async (req, res) => {
  const { pinCode } = req.body;
  const user = await Passenger.findById(req.user.passengerId);
  if (!user || !user.pinCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "PIN not set" });
  }
  const ok = await user.comparePinCode(pinCode);
  if (!ok) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid PIN" });
  }
  res.status(StatusCodes.OK).json({ msg: "PIN verified" });
};

// ============================================================
// USER LOGIN (phone + PIN)
// ============================================================

// Returning users authenticate with phone + the PIN they set at sign-up.
// Issues real access/refresh cookies. Rate-limited at the router.
const login = async (req, res) => {
  const { phoneNumber, pinCode } = req.body;

  const user = await Passenger.findOne({ phoneNumber });
  if (!user || !user.pinCode || !user.isPhoneVerified) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid credentials" });
  }

  const ok = await user.comparePinCode(pinCode);
  if (!ok) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid credentials" });
  }

  await issueUserSession(req, res, user, {
    msg: "Login successful",
    nextStep: user.isProfileComplete ? null : "complete-profile",
  });
};

const userLogout = async (req, res) => {
  await PassengerToken.findOneAndDelete({ passenger: req.user.passengerId });
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "Logged out" });
};

// Helper: issue tokens + attach cookies + send response.
async function issueUserSession(req, res, user, extra = {}) {
  const tokenPayload = createTokenPassenger(user);
  // Ensure roles travel in the token so the client and middleware can gate
  // routes without an extra DB lookup.
  tokenPayload.roles = user.roles;

  const refreshToken = crypto.randomBytes(40).toString("hex");
  await PassengerToken.findOneAndDelete({ passenger: user._id });
  await PassengerToken.create({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    passenger: user._id,
  });

  attachPassengerCookiesToResponse({
    res,
    passenger: tokenPayload,
    refreshToken,
  });

  res.status(StatusCodes.OK).json({
    ...extra,
    user: tokenPayload,
  });
}

// ============================================================
// ADMIN AUTH (separate collection, invite-based)
// ============================================================

const INVITE_TTL_HOURS = 48;

const inviteAdmin = async (req, res) => {
  const { email, role = "admin" } = req.body;
  if (!["admin", "super_admin"].includes(role)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid role" });
  }
  const normalizedEmail = email.toLowerCase().trim();

  if (await Admin.findOne({ email: normalizedEmail })) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "An admin with this email already exists" });
  }

  await AdminInvite.deleteMany({ email: normalizedEmail, used: false });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = createHash(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  await AdminInvite.create({
    email: normalizedEmail,
    tokenHash,
    role,
    invitedBy: req.user.adminId,
    expiresAt,
  });

  const dashboardUrl =
    process.env.ADMIN_DASHBOARD_URL || "https://admin.troski.com";
  const inviteLink = `${dashboardUrl}/register?token=${rawToken}&email=${encodeURIComponent(
    normalizedEmail,
  )}`;

  try {
    await sendOTPEmail({
      email: normalizedEmail,
      otpCode: `Click to register as an admin: ${inviteLink}`,
    });
  } catch (e) {
    console.error("Failed to send admin invite email", e);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Could not send invite email" });
  }

  res.status(StatusCodes.CREATED).json({
    msg: "Invite sent",
    email: normalizedEmail,
    expiresAt,
  });
};

const verifyAdminInvite = async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ valid: false, msg: "Missing token or email" });
  }
  const invite = await AdminInvite.findOne({
    email: email.toLowerCase().trim(),
    tokenHash: createHash(token),
  });
  if (!invite) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ valid: false, msg: "Invite not found" });
  }
  if (invite.used) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ valid: false, msg: "Invite already used" });
  }
  if (invite.expiresAt < new Date()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ valid: false, msg: "Invite expired" });
  }
  res
    .status(StatusCodes.OK)
    .json({ valid: true, email: invite.email, role: invite.role });
};

const registerAdminWithInvite = async (req, res) => {
  const { token, email, username, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const invite = await AdminInvite.findOne({
    email: normalizedEmail,
    tokenHash: createHash(token),
  });
  if (!invite || invite.used || invite.expiresAt < new Date()) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid or expired invite" });
  }
  if (await Admin.findOne({ username })) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Username already taken" });
  }

  await Admin.create({
    username,
    password,
    email: normalizedEmail,
    role: invite.role,
    invitedBy: invite.invitedBy,
  });
  invite.used = true;
  invite.usedAt = new Date();
  await invite.save();

  res
    .status(StatusCodes.CREATED)
    .json({ msg: "Admin account created. Please log in.", username });
};

const listAdminInvites = async (req, res) => {
  const invites = await AdminInvite.find()
    .sort({ createdAt: -1 })
    .populate("invitedBy", "username email")
    .lean();
  const cleaned = invites.map(({ tokenHash, ...rest }) => rest);
  res.status(StatusCodes.OK).json({ invites: cleaned });
};

const revokeAdminInvite = async (req, res) => {
  const invite = await AdminInvite.findById(req.params.id);
  if (!invite) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Invite not found" });
  }
  if (invite.used) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Cannot revoke a used invite" });
  }
  await invite.deleteOne();
  res.status(StatusCodes.OK).json({ msg: "Invite revoked" });
};

const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Please provide username and password" });
  }

  const admin = await Admin.findOne({ username });
  if (!admin) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Admin not found" });
  }

  const isPasswordCorrect = await admin.comparePassword(password);
  if (!isPasswordCorrect) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid credentials" });
  }

  const tokenAdmin = createTokenAdmin(admin);
  const refreshToken = crypto.randomBytes(40).toString("hex");
  await AdminToken.findOneAndDelete({ admin: admin._id });
  await AdminToken.create({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    admin: admin._id,
  });
  attachAdminCookiesToResponse({ res, admin: tokenAdmin, refreshToken });
  res.status(StatusCodes.OK).json({ msg: "Login successful", admin: tokenAdmin });
};

const adminLogout = async (req, res) => {
  await AdminToken.findOneAndDelete({ admin: req.user.adminId });
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "admin logged out!" });
};

module.exports = {
  // User (passenger + driver share this — roles differ)
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
};
