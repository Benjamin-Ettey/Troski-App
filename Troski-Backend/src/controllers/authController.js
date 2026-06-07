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
const cloudinary = require("cloudinary");

const {
  attachPassengerCookiesToResponse,
  attachAdminCookiesToResponse,
} = require("../utils/tokenUtils");
const { sendOTPEmail } = require("../utils/sendOTPEmail");
const { sendOTPSMS } = require("../utils/sendOTPSMS");
const createHash = require("../utils/createHash");
const createTokenPassenger = require("../utils/createTokenPassenger");
const createTokenAdmin = require("../utils/createTokenAdmin");
const { formatImage } = require("../middleware/multerMiddleware");

// ============================================================
// USER SIGN-UP (3 STEPS)
// ============================================================

// STEP 1 — collect identity + send OTP.
// Frontend sends ALL required fields in one body:
//   { name, username, phoneNumber, email, pinCode, gender, dateOfBirth }
// If a record exists but is unverified, we reuse and update it.
const userSignUp = async (req, res) => {
  const {
    name,
    username,
    phoneNumber,
    email,
    pinCode,
    gender,
    dateOfBirth,
  } = req.body;

  const existing = await Passenger.findOne({ phoneNumber });

  if (existing && existing.isPhoneVerified) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "An account with this phone number already exists. Please log in.",
    });
  }

  // Username uniqueness check — but allow re-using if it's the same
  // unverified user picking up where they left off.
  const usernameTaken = await Passenger.findOne({
    username: username.toLowerCase(),
    phoneNumber: { $ne: phoneNumber },
  }).select("_id");
  if (usernameTaken) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "That username is already taken. Please choose another.",
    });
  }

  let user;
  if (existing) {
    existing.name = name;
    existing.username = username.toLowerCase();
    existing.email = email;
    existing.pinCode = pinCode; // re-hashed by pre('save')
    existing.gender = gender;
    existing.dateOfBirth = new Date(dateOfBirth);
    user = existing;
  } else {
    user = new Passenger({
      name,
      username: username.toLowerCase(),
      phoneNumber,
      email,
      pinCode,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      roles: ["passenger"],
      isPhoneVerified: false,
      isProfileComplete: false,
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.otpCode = createHash(otpCode);
  user.otpExpiresAt = new Date(Date.now() + 1000 * 60 * 5);

  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key — either username or phone race
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Username or phone number already in use.",
      });
    }
    throw err;
  }

  const method = (req.body.method || "sms").toLowerCase();
  if (method === "email") {
    await sendOTPEmail({ email: user.email, otpCode });
  } else {
    await sendOTPSMS({ phoneNumber: user.phoneNumber, otpCode });
  }

  res.status(StatusCodes.CREATED).json({
    msg: "Sign-up started. OTP sent for verification.",
    phoneNumber: user.phoneNumber,
  });
};

// STEP 2 — verify the OTP from sign-up. Marks verified, logs the user in.
const verifySignUpOTP = async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  const user = await Passenger.findOne({ phoneNumber });
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Sign-up not started for this phone number" });
  }
  if (user.isPhoneVerified) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Account already verified. Please log in." });
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

  await issueUserSession(req, res, user, {
    msg: "Phone verified. Please complete your profile.",
    nextStep: "complete-profile",
  });
};

// OPTIONAL profile completion. JSON only — the profile photo has its own
// dedicated REQUIRED endpoint at /auth/upload-photo. This is for the
// "tell us a bit more about you" screen the app shows after onboarding:
//
//   {
//     dateOfBirth: "2000-01-15",
//     gender: "female",
//     emergencyContact: { name: "Yaa Mensah", phoneNumber: "0244000002" }
//   }
//
// All three fields are optional; the user can fill any subset. Each one
// is validated independently. Setting isProfileComplete = true is purely
// informational (we don't gate anything on it).
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

  const { dateOfBirth, gender, emergencyContact } = req.body || {};

  if (dateOfBirth !== undefined) {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid date of birth" });
    }
    // 18+ check — already enforced by validateCompleteProfileInput, but
    // double-check here in case validation is bypassed.
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (dob > eighteenYearsAgo) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "You must be at least 18 years old" });
    }
    user.dateOfBirth = dob;
  }

  if (gender !== undefined) {
    const allowed = ["male", "female", "other"];
    if (!allowed.includes(gender)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `gender must be one of: ${allowed.join(", ")}`,
      });
    }
    user.gender = gender;
  }

  if (emergencyContact !== undefined) {
    if (
      !emergencyContact ||
      typeof emergencyContact !== "object" ||
      !emergencyContact.name ||
      !emergencyContact.phoneNumber
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "emergencyContact must include both 'name' and 'phoneNumber'",
      });
    }
    user.emergencyContact = {
      name: String(emergencyContact.name).trim(),
      phoneNumber: String(emergencyContact.phoneNumber).trim(),
    };
  }

  user.isProfileComplete = true;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: "Profile updated", user });
};

// REQUIRED onboarding step. Called right after the user finishes the
// PIN flow — the frontend pushes the photo here before letting the user
// into the rest of the app. Profile photo can be any image (passengers).
// On success: sets profilePhoto + flips isOnboardingComplete=true, after
// which `requireOnboardingComplete` middleware lets the user through.
const uploadPhoto = async (req, res) => {
  const user = await Passenger.findById(req.user.passengerId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!user.isPhoneVerified) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Verify your phone number first" });
  }

  if (!req.file) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "A photo upload is required" });
  }

  try {
    const formatted = formatImage(req.file);
    const uploaded = await cloudinary.v2.uploader.upload(formatted, {
      use_filename: true,
      folder: "/Troski/Troski-Profile-Photos",
    });

    // Clean up any previous photo before swapping in the new one.
    if (user.profilePhotoPublicId) {
      cloudinary.v2.uploader
        .destroy(user.profilePhotoPublicId)
        .catch((e) => console.error("Failed deleting old profile photo", e));
    }

    user.profilePhoto = uploaded.secure_url;
    user.profilePhotoPublicId = uploaded.public_id;
    user.isOnboardingComplete = true;
    await user.save();

    res.status(StatusCodes.OK).json({
      msg: "Photo uploaded. Onboarding complete.",
      user,
    });
  } catch (err) {
    console.error("uploadPhoto failed", err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Photo upload failed. Please try again." });
  }
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
// USER LOGIN (OTP)
// ============================================================

const requestLoginOTP = async (req, res) => {
  const { phoneNumber, method = "sms" } = req.body;
  const user = await Passenger.findOne({ phoneNumber });

  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Account not found" });
  }
  if (!user.isPhoneVerified) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "Phone number not verified. Please complete sign-up.",
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.otpCode = createHash(otpCode);
  user.otpExpiresAt = new Date(Date.now() + 1000 * 60 * 5);
  await user.save();

  if (method === "email") {
    await sendOTPEmail({ email: user.email, otpCode });
  } else {
    await sendOTPSMS({ phoneNumber: user.phoneNumber, otpCode });
  }

  res.status(StatusCodes.OK).json({
    msg:
      method === "email"
        ? "OTP sent to email successfully"
        : "OTP sent to phone number successfully",
  });
};

const verifyLoginOTP = async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  const user = await Passenger.findOne({ phoneNumber });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!user.isPhoneVerified) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "Phone number not verified. Please complete sign-up.",
    });
  }
  if (!user.otpCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No OTP request found" });
  }
  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "OTP has expired" });
  }
  if (createHash(otpCode) !== user.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid OTP" });
  }

  user.otpCode = null;
  user.otpExpiresAt = null;
  await user.save();

  await issueUserSession(req, res, user, { msg: "Login successful" });
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
  uploadPhoto,
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
};
