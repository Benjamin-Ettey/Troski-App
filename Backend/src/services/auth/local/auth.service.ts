import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import User from "../../../models/User";
import DriverProfile from "../../../models/DriverProfile";
import Token from "../../../models/Token";
import Otp from "../../../models/Otp";
import { generateOtp, hashOtp, verifyOtpHash } from "../../../utils/otpUtils";
import { sendOtpSms, sendWelcomeSms } from "../../sms/sms.service";
import { sendOtpEmail, sendWelcomeEmail } from "../../email/email.service";
import { TokenUser, RoleType, OtpPurpose } from "../../../types/user.types";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

export type ServiceResponse = {
  status: number;
  message?: string;
  data?: any;
  cookieData?: {
    user: TokenUser;
    refreshToken: string;
  };
};

const verifyOtpInternal = async (
  phoneNumber: string,
  email: string,
  otpCode: string,
  purpose: OtpPurpose,
): Promise<{
  error: ServiceResponse | null;
  verifiedVia?: "sms" | "email";
}> => {
  // Find the most recent unused OTP for EITHER the phone number (SMS) or email (Fallback)
  const otpRecord = await Otp.findOne({
    $or: [
      { phoneNumber, deliveryMethod: "sms" },
      { email, deliveryMethod: "email" },
    ],
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return {
      error: {
        status: StatusCodes.BAD_REQUEST,
        message: "Invalid or expired OTP",
      },
    };
  }

  const isValid = await verifyOtpHash(otpCode, otpRecord.otpHash);
  if (!isValid) {
    otpRecord.attemptCount += 1;
    await otpRecord.save();
    return {
      error: { status: StatusCodes.BAD_REQUEST, message: "Incorrect OTP" },
    };
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  return {
    error: null,
    verifiedVia: otpRecord.deliveryMethod as "sms" | "email",
  };
};

export const requestOtpService = async (
  identifier: string,
  deliveryMethod: "sms" | "email",
  purpose: OtpPurpose,
  name: string = "User",
): Promise<ServiceResponse> => {
  const query =
    deliveryMethod === "sms"
      ? { phoneNumber: identifier }
      : { email: identifier };

  const recentOtps = await Otp.countDocuments({
    ...query,
    purpose,
    createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) },
  });

  if (recentOtps >= 3) {
    return {
      status: StatusCodes.TOO_MANY_REQUESTS,
      message: "Too many OTP requests. Please try again in 15 minutes.",
    };
  }

  const otpCode = generateOtp();
  const otpHash = await hashOtp(otpCode);

  await Otp.create({
    ...query,
    deliveryMethod,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  try {
    if (deliveryMethod === "email") {
      await sendOtpEmail(identifier, name, otpCode);
    } else if (process.env.NODE_ENV === "development") {
      console.log(`[DEV OTP] ${identifier}: ${otpCode}`);
    } else {
      await sendOtpSms(identifier, otpCode);
    }
  } catch (error) {
    return {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: `Failed to send OTP via ${deliveryMethod}. Please try again later.`,
    };
  }

  return {
    status: StatusCodes.OK,
    message: `OTP sent successfully via ${deliveryMethod.toUpperCase()}`,
  };
};

export const registerPassengerService = async (
  payload: {
    name: string;
    email: string;
    phoneNumber: string;
    pin: string;
    otpCode: string;
  },
  ip: string,
  userAgent: string | undefined,
): Promise<ServiceResponse> => {
  const { name, email, phoneNumber, pin, otpCode } = payload;

  const existingUser = await User.findOne({
    role: "passenger",
    $or: [{ email }, { phoneNumber }],
  });
  if (existingUser) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message:
        existingUser.email === email
          ? "Email already exists"
          : "Phone number already exists",
    };
  }

  const { error: otpError, verifiedVia } = await verifyOtpInternal(
    phoneNumber,
    email,
    otpCode,
    "signup",
  );
  if (otpError) return otpError;

  const user = await User.create({
    name,
    email,
    phoneNumber,
    pinHash: pin,
    role: "passenger" as RoleType,
    phoneVerified: true,
  });

  const tokenUser: TokenUser = {
    _id: user._id,
    name: user.name,
    role: user.role as RoleType,
    accountStatus: user.accountStatus,
  };

  const refreshToken = crypto.randomBytes(40).toString("hex");
  await Token.create({ refreshToken, ip, userAgent, user: user._id });

  // Send welcome message via the method they used to verify
  if (verifiedVia === "email") {
    sendWelcomeEmail(email, name, "passenger").catch(console.error);
  } else if (process.env.NODE_ENV === "development") {
    console.log(`[DEV WELCOME SMS] ${phoneNumber}`);
  } else {
    sendWelcomeSms(phoneNumber, "passenger").catch(console.error);
  }

  return {
    status: StatusCodes.CREATED,
    message: "Passenger registered successfully",
    cookieData: { user: tokenUser, refreshToken },
  };
};

export const registerDriverService = async (
  payload: {
    name: string;
    email: string;
    phoneNumber: string;
    pin: string;
    otpCode: string;
  },
  ip: string,
  userAgent: string | undefined,
): Promise<ServiceResponse> => {
  const { name, email, phoneNumber, pin, otpCode } = payload;

  const existingUser = await User.findOne({
    role: "driver",
    $or: [{ email }, { phoneNumber }],
  });
  if (existingUser) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message:
        existingUser.email === email
          ? "Email already exists"
          : "Phone number already exists",
    };
  }

  const { error: otpError, verifiedVia } = await verifyOtpInternal(
    phoneNumber,
    email,
    otpCode,
    "signup",
  );
  if (otpError) return otpError;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [user] = await User.create(
      [
        {
          name,
          email,
          phoneNumber,
          pinHash: pin,
          role: "driver" as RoleType,
          phoneVerified: true,
        },
      ],
      { session },
    );

    await DriverProfile.create(
      [
        {
          user: user._id,
          verificationStatus: "incomplete",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    const tokenUser: TokenUser = {
      _id: user._id,
      name: user.name,
      role: user.role as RoleType,
      accountStatus: user.accountStatus,
    };

    const refreshToken = crypto.randomBytes(40).toString("hex");
    await Token.create({ refreshToken, ip, userAgent, user: user._id });

    if (verifiedVia === "email") {
      sendWelcomeEmail(email, name, "driver").catch(console.error);
    } else if (process.env.NODE_ENV === "development") {
      console.log(`[DEV WELCOME SMS] ${phoneNumber}`);
    } else {
      sendWelcomeSms(phoneNumber, "driver").catch(console.error);
    }

    return {
      status: StatusCodes.CREATED,
      message: "Driver registered successfully",
      cookieData: { user: tokenUser, refreshToken },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "An error occurred during registration.",
    };
  }
};

export const loginUserService = async (
  payload: { phoneNumber: string; pin: string; expectedRole: RoleType },
  ip: string,
  userAgent: string | undefined,
): Promise<ServiceResponse> => {
  const { phoneNumber, pin, expectedRole } = payload;

  if (!phoneNumber || !pin) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Please provide phone number and PIN",
    };
  }

  const user = await User.findOne({
    phoneNumber,
    role: expectedRole,
  }).select("+pinHash");

  if (!user) {
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }

  if (user.accountStatus === "deactivated") {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "Account has been deactivated",
    };
  }

  if (user.accountStatus === "suspended") {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "Account is suspended. Contact support.",
    };
  }

  if (user.lockUntil && user.lockUntil < new Date()) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return {
      status: StatusCodes.LOCKED,
      message: `Account locked. Try again in ${minutes} minutes.`,
    };
  }

  if (!user.pinHash) {
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }

  const isPinCorrect = await bcrypt.compare(pin, user.pinHash);

  if (!isPinCorrect) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME);
    }
    await user.save();
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }

  if (!user.phoneVerified) {
    return {
      status: StatusCodes.UNAUTHORIZED,
      message: "Please verify your phone number",
    };
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const tokenUser: TokenUser = {
    _id: user._id,
    name: user.name,
    role: user.role as RoleType,
    accountStatus: user.accountStatus,
  };

  let refreshToken = "";
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    if (!existingToken.isValid) {
      return {
        status: StatusCodes.UNAUTHORIZED,
        message: "Invalid credentials",
      };
    }
    refreshToken = existingToken.refreshToken;
    return {
      status: StatusCodes.OK,
      message: "Login successful",
      cookieData: { user: tokenUser, refreshToken },
    };
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  await Token.create({ refreshToken, ip, userAgent, user: user._id });

  return {
    status: StatusCodes.OK,
    message: "Login successful",
    cookieData: { user: tokenUser, refreshToken },
  };
};

export const logoutUserService = async (userId: string): Promise<void> => {
  await Token.deleteMany({ user: userId });
};

export const registerAdminService = async (
  payload: {
    name: string;
    email: string;
    adminId: string;
    password: string;
  },
  ip: string,
  userAgent: string | undefined,
): Promise<ServiceResponse> => {
  const { name, email, adminId, password } = payload;

  const existingAdmin = await User.findOne({
    role: "admin",
    $or: [{ email }, { adminId }],
  });

  if (existingAdmin) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message:
        existingAdmin.email === email
          ? "Email already exists"
          : "Admin ID already exists",
    };
  }

  // Create admin directly (No OTP required for Admin setup via Postman)
  const user = await User.create({
    name,
    email,
    adminId,
    password,
    role: "admin" as RoleType,
    emailVerified: true, // Auto-verify admin email since it's created internally
  });

  const tokenUser: TokenUser = {
    _id: user._id,
    name: user.name,
    role: user.role as RoleType,
    accountStatus: user.accountStatus,
  };

  const refreshToken = crypto.randomBytes(40).toString("hex");
  await Token.create({ refreshToken, ip, userAgent, user: user._id });

  return {
    status: StatusCodes.CREATED,
    message: "Admin registered successfully",
    cookieData: { user: tokenUser, refreshToken },
  };
};

export const loginAdminService = async (
  payload: { adminId: string; password: string },
  ip: string,
  userAgent: string | undefined,
): Promise<ServiceResponse> => {
  const { adminId, password } = payload;

  if (!adminId || !password) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Please provide Admin ID and Password",
    };
  }

  const user = await User.findOne({
    adminId,
    role: "admin",
  }).select("+password");

  if (!user) {
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }

  if (user.accountStatus === "deactivated") {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "Account has been deactivated",
    };
  }

  if (user.accountStatus === "suspended") {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "Account is suspended. Contact higher admin.",
    };
  }

  if (user.lockUntil && user.lockUntil < new Date()) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return {
      status: StatusCodes.LOCKED,
      message: `Account locked. Try again in ${minutes} minutes.`,
    };
  }

  if (!user.password) {
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME);
    }
    await user.save();
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const tokenUser: TokenUser = {
    _id: user._id,
    name: user.name,
    role: user.role as RoleType,
    accountStatus: user.accountStatus,
  };

  let refreshToken = "";
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    if (!existingToken.isValid) {
      return {
        status: StatusCodes.UNAUTHORIZED,
        message: "Invalid credentials",
      };
    }
    refreshToken = existingToken.refreshToken;
    return {
      status: StatusCodes.OK,
      message: "Admin Login successful",
      cookieData: { user: tokenUser, refreshToken },
    };
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  await Token.create({ refreshToken, ip, userAgent, user: user._id });

  return {
    status: StatusCodes.OK,
    message: "Admin Login successful",
    cookieData: { user: tokenUser, refreshToken },
  };
};
