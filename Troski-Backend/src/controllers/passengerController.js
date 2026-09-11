const { StatusCodes } = require("http-status-codes");

const Passenger = require("../models/passengers");
const Booking = require("../models/bookings");
const Wallet = require("../models/Wallet");
const Notification = require("../models/notifications");
const PassengerToken = require("../models/passengerToken");

const createHash = require("../utils/createHash");
const { sendOTPEmail } = require("../utils/sendOTPEmail");
const { sendOTPSMS } = require("../utils/sendOTPSMS");
const {
  generateBalanceHash,
  verifyWalletIntegrity,
} = require("../utils/hashUtils");
const { notify } = require("../utils/notify");

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/passenger/current
// Returns the current logged-in user (Passenger.toJSON strips secrets).
// ─────────────────────────────────────────────────────────────────────
const getCurrentPassenger = async (req, res) => {
  const passenger = await Passenger.findOne({ _id: req.user.passengerId });
  if (!passenger) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  res.status(StatusCodes.OK).json({ passenger: passenger.toJSON() });
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/passenger/ride-history?days=7
// Returns the user's bookings from the last N days (default 7, max 90),
// latest first, with the trip + driver + vehicle populated for display.
// ─────────────────────────────────────────────────────────────────────
const getRideHistory = async (req, res) => {
  const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 7, 90));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const bookings = await Booking.find({
    passenger: req.user.passengerId,
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "trip",
      select: "dropoffLocation status driver vehicle",
      populate: [
        {
          path: "driver",
          populate: { path: "user", select: "name profilePhoto" },
        },
        { path: "vehicle", select: "plateNumber vehicleColor vehicleType" },
      ],
    });

  res.status(StatusCodes.OK).json({
    days,
    count: bookings.length,
    bookings,
  });
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/passenger/notifications?limit=20&unreadOnly=true
// ─────────────────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const filter = { user: req.user.passengerId };
  if (req.query.unreadOnly === "true") filter.read = false;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    user: req.user.passengerId,
    read: false,
  });

  res.status(StatusCodes.OK).json({
    count: notifications.length,
    unreadCount,
    notifications,
  });
};

const markNotificationRead = async (req, res) => {
  const result = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.passengerId },
    { $set: { read: true, readAt: new Date() } },
    { new: true },
  );
  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Notification not found" });
  }
  res.status(StatusCodes.OK).json({ notification: result });
};

const markAllNotificationsRead = async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user.passengerId, read: false },
    { $set: { read: true, readAt: new Date() } },
  );
  res
    .status(StatusCodes.OK)
    .json({ updated: result.modifiedCount, msg: "All marked as read" });
};

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/v1/passenger/me/username
// Body: { username }
// No extra auth check — username has no security implications. Just
// authenticated, just change it.
// ─────────────────────────────────────────────────────────────────────
const changeUsername = async (req, res) => {
  const { username } = req.body || {};
  if (
    !username ||
    typeof username !== "string" ||
    !/^[a-z0-9._]{3,30}$/i.test(username)
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "username must be 3-30 chars: lowercase letters, numbers, dots, underscores only",
    });
  }
  const normalized = username.toLowerCase();

  const taken = await Passenger.findOne({
    username: normalized,
    _id: { $ne: req.user.passengerId },
  }).select("_id");
  if (taken) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "That username is already taken." });
  }

  const user = await Passenger.findByIdAndUpdate(
    req.user.passengerId,
    { $set: { username: normalized } },
    { new: true },
  );
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  res
    .status(StatusCodes.OK)
    .json({ msg: "Username updated", username: user.username });
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/v1/passenger/me/change-pin
// Body: { currentPinCode, newPinCode }
// Requires the user to prove they know the current PIN before swapping.
// ─────────────────────────────────────────────────────────────────────
const changePin = async (req, res) => {
  const { currentPinCode, newPinCode } = req.body || {};
  if (!currentPinCode || !newPinCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "currentPinCode and newPinCode are required" });
  }
  if (!/^\d{6}$/.test(newPinCode)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "newPinCode must be 6 digits" });
  }
  if (currentPinCode === newPinCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "New PIN must be different from current PIN" });
  }

  const user = await Passenger.findById(req.user.passengerId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!(await user.comparePinCode(currentPinCode))) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Current PIN is incorrect" });
  }

  user.pinCode = newPinCode; // pre('save') hook re-hashes
  await user.save();

  notify({
    userId: user._id,
    type: "system",
    title: "PIN updated",
    message:
      "Your PIN was changed. If this wasn't you, contact support immediately.",
  });

  res.status(StatusCodes.OK).json({ msg: "PIN updated successfully" });
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/v1/passenger/me/change-email/start
// Body: { newEmail, currentPinCode }
// Verifies PIN, stores pendingEmail + OTP, sends OTP to the NEW address.
// ─────────────────────────────────────────────────────────────────────
const startChangeEmail = async (req, res) => {
  const { newEmail, currentPinCode } = req.body || {};
  if (!newEmail || typeof newEmail !== "string") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "newEmail is required" });
  }
  if (!currentPinCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "currentPinCode is required" });
  }

  const user = await Passenger.findById(req.user.passengerId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!(await user.comparePinCode(currentPinCode))) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Current PIN is incorrect" });
  }
  if (newEmail.toLowerCase().trim() === (user.email || "").toLowerCase()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "That is already your current email" });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.pendingEmail = {
    value: newEmail.toLowerCase().trim(),
    otpCode: createHash(otpCode),
    otpExpiresAt: new Date(Date.now() + 1000 * 60 * 10),
  };
  await user.save();

  await sendOTPEmail({ email: newEmail, otpCode });

  res.status(StatusCodes.OK).json({
    msg: `OTP sent to ${newEmail}. Confirm to complete the change.`,
    nextStep: "change-email/verify",
  });
};

// POST /api/v1/passenger/me/change-email/verify  Body: { otpCode }
const verifyChangeEmail = async (req, res) => {
  const { otpCode } = req.body || {};
  if (!otpCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "otpCode is required" });
  }

  const user = await Passenger.findById(req.user.passengerId);
  if (!user || !user.pendingEmail?.value) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No email change in progress" });
  }
  if (user.pendingEmail.otpExpiresAt < new Date()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "OTP expired. Start the change again." });
  }
  if (createHash(otpCode) !== user.pendingEmail.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid OTP" });
  }

  user.email = user.pendingEmail.value;
  user.pendingEmail = { value: null, otpCode: null, otpExpiresAt: null };
  await user.save();

  notify({
    userId: user._id,
    type: "system",
    title: "Email updated",
    message: `Your email was changed to ${user.email}. If this wasn't you, contact support immediately.`,
  });

  res.status(StatusCodes.OK).json({ msg: "Email updated", email: user.email });
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/v1/passenger/me/change-phone/start
// Body: { newPhoneNumber, currentPinCode }
// ─────────────────────────────────────────────────────────────────────
const startChangePhone = async (req, res) => {
  const { newPhoneNumber, currentPinCode } = req.body || {};
  if (!newPhoneNumber || typeof newPhoneNumber !== "string") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "newPhoneNumber is required" });
  }
  if (!currentPinCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "currentPinCode is required" });
  }

  const user = await Passenger.findById(req.user.passengerId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }
  if (!(await user.comparePinCode(currentPinCode))) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Current PIN is incorrect" });
  }
  if (newPhoneNumber.trim() === user.phoneNumber) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "That is already your current phone number" });
  }

  const taken = await Passenger.findOne({
    phoneNumber: newPhoneNumber.trim(),
    _id: { $ne: user._id },
  }).select("_id");
  if (taken) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "That phone number is already in use by another account" });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.pendingPhoneNumber = {
    value: newPhoneNumber.trim(),
    otpCode: createHash(otpCode),
    otpExpiresAt: new Date(Date.now() + 1000 * 60 * 10),
  };
  await user.save();

  await sendOTPSMS({ phoneNumber: newPhoneNumber, otpCode });

  res.status(StatusCodes.OK).json({
    msg: `OTP sent to ${newPhoneNumber}. Confirm to complete the change.`,
    nextStep: "change-phone/verify",
  });
};

// POST /api/v1/passenger/me/change-phone/verify  Body: { otpCode }
//
// On success:
//   1. Update Passenger.phoneNumber
//   2. Update Wallet.phoneNumber + REGENERATE balanceHash (phone is part
//      of the integrity hash, so we MUST rehash or every future wallet
//      op will fail the integrity check)
//   3. Delete the user's PassengerToken rows → all sessions invalidated
//   4. Clear cookies on this response → user has to log in again with the
//      new number on next request
const verifyChangePhone = async (req, res) => {
  const { otpCode } = req.body || {};
  if (!otpCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "otpCode is required" });
  }

  const user = await Passenger.findById(req.user.passengerId);
  if (!user || !user.pendingPhoneNumber?.value) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No phone change in progress" });
  }
  if (user.pendingPhoneNumber.otpExpiresAt < new Date()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "OTP expired. Start the change again." });
  }
  if (createHash(otpCode) !== user.pendingPhoneNumber.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid OTP" });
  }

  const newPhone = user.pendingPhoneNumber.value;

  // 1. Wallet first — if integrity check fails, abort BEFORE changing the
  // user (otherwise the wallet ends up with stale phoneNumber on its hash).
  const wallet = await Wallet.findOne({ user: user._id });
  if (wallet) {
    if (!verifyWalletIntegrity(wallet)) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        msg: "Wallet integrity check failed — contact support before changing your phone number.",
      });
    }
    wallet.phoneNumber = newPhone;
    wallet.balanceHash = generateBalanceHash(
      wallet.balance,
      wallet.escrowBalance,
      newPhone,
    );
    await wallet.save();
  }

  // 2. User
  user.phoneNumber = newPhone;
  user.pendingPhoneNumber = { value: null, otpCode: null, otpExpiresAt: null };
  await user.save();

  // 3. Kill all sessions
  await PassengerToken.deleteMany({ passenger: user._id });

  // 4. Best-effort notification (it'll be visible when they log back in)
  notify({
    userId: user._id,
    type: "system",
    title: "Phone number updated",
    message: `Your phone number was changed to ${newPhone}. You'll need to log in again.`,
  });

  // Clear auth cookies on this response
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({
    msg: "Phone number updated. Please log in again with the new number.",
    phoneNumber: newPhone,
  });
};

module.exports = {
  getCurrentPassenger,
  getRideHistory,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  changeUsername,
  changePin,
  startChangeEmail,
  verifyChangeEmail,
  startChangePhone,
  verifyChangePhone,
};
