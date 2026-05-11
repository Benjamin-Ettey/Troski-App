const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Token = require("../models/Token");

const crypto = require("crypto");
const cloudinary = require("cloudinary");

const { StatusCodes } = require("http-status-codes");

const { attachCookiesToResponse } = require("../utils/tokenUtils");

const createHash = require("../utils/createHash");
const createTokenUser = require("../utils/createTokenUser");

const { sendOTPEmail } = require("../utils/sendOTPEmail");
const { sendOTPSMS } = require("../utils/sendOTPSMS");

const { formatImage } = require("../middleware/multerMiddleware");

const {
  generateBalanceHash,
  verifyWalletIntegrity,
} = require("../utils/hashUtils");

const signUp = async (req, res) => {
  const { phoneNumber, email, role } = req.body;

  // 1. Check if user exists
  const existingUser = await User.findOne({
    $or: [
      { phoneNumber, role },
      { email, role },
    ],
  });

  if (existingUser) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `A ${role} account with this phone number or email already exists.`,
    });
  }

  const uploadFields = {
    ghanaCardImage: "Ghana card",
    licenseImage: "license",
  };

  if (role === "driver") {
    const missingFields = Object.keys(uploadFields).filter((field) => {
      return !(req.files && req.files[field] && req.files[field][0]);
    });

    if (missingFields.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `Please upload photo of ${missingFields.map((f) => uploadFields[f]).join(", ")}`,
      });
    }
  }

  const uploadedPublicIds = [];
  try {
    if (role === "driver") {
      await Promise.all(
        Object.keys(uploadFields).map(async (field) => {
          if (req.files && req.files[field]) {
            const file = formatImage(req.files[field][0]);
            const response = await cloudinary.v2.uploader.upload(file, {
              use_filename: true,
              folder: `/Troski/Troski-Driver-${field}s`,
            });
            req.body[field] = response.secure_url;
            req.body[`${field}PublicId`] = response.public_id;
            uploadedPublicIds.push(response.public_id);
          }
        }),
      );
    }

    // 2. Create the User
    const user = await User.create(req.body);

    // 3. SHARED WALLET LOGIC WITH INTEGRITY CHECK
    const existingWallet = await Wallet.findOne({ phoneNumber });

    if (!existingWallet) {
      // Create a brand new wallet with a fresh seal
      const initialHash = generateBalanceHash(0, 0, user.phoneNumber);

      await Wallet.create({
        user: user._id,
        phoneNumber: user.phoneNumber,
        balance: 0,
        escrowBalance: 0,
        balanceHash: initialHash,
      });
    } else {
      // VALIDATE SHARED WALLET: Ensure the existing wallet hasn't been tampered with
      if (!verifyWalletIntegrity(existingWallet)) {
        // If the wallet is corrupted, we throw an error to trigger the catch block.
        // This will clean up any uploaded Cloudinary images.
        throw new Error(
          "Security Alert: The existing wallet associated with this number is compromised. Contact support.",
        );
      }

      console.log(`Verified integrity for shared wallet: ${phoneNumber}`);
    }

    res.status(StatusCodes.CREATED).json({
      msg: "User created successfully",
      user,
    });
  } catch (error) {
    // 4. CLEANUP: If anything fails (including the integrity check), delete uploaded images
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map((id) =>
          cloudinary.v2.uploader.destroy(id).catch(() => {}),
        ),
      );
    }

    // Determine the status code based on the error type
    const statusCode = error.message.includes("Security Alert")
      ? StatusCodes.FORBIDDEN
      : StatusCodes.INTERNAL_SERVER_ERROR;

    return res
      .status(statusCode)
      .json({ msg: "Signup failed", error: error.message });
  }
};

const requestOTP = async (req, res) => {
  const { phoneNumber, role, method = "sms" } = req.body;

  const user = await User.findOne({ phoneNumber, role });

  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
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

  res.status(StatusCodes.OK).json({ msg: "OTP sent successfully" });
};

const verifyOTP = async (req, res) => {
  const { phoneNumber, role, otpCode } = req.body;

  const user = await User.findOne({ phoneNumber, role });

  if (!user || !user.otpCode || user.otpCode !== createHash(otpCode)) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid OTP" });
  }

  if (user.otpExpiresAt < new Date()) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "OTP expired" });
  }

  user.otpCode = null;
  user.otpExpiresAt = null;
  await user.save();

  const tokenUser = createTokenUser(user);
  let refreshToken = "";
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    return res
      .status(StatusCodes.OK)
      .json({ msg: "Login successful", user: tokenUser });
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  await Token.create({
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    user: user._id,
  });
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  res.status(StatusCodes.OK).json({ msg: "Login successful", user: tokenUser });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "Logged out successfully" });
};

module.exports = { signUp, requestOTP, verifyOTP, logout };
