import { OAuth2Client } from "google-auth-library";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "../local/auth.service";
import crypto from "crypto";
import Token from "../../../models/Token";
import User from "../../../models/User";
import { RoleType } from "../../../types/user.types";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuthService = async (
  payload: { idToken: string; role?: RoleType; phoneNumber?: string },
  ip: string,
  userAgent: string | undefined,
): Promise<ServiceResponse> => {
  const { idToken, role, phoneNumber } = payload;

  // 1. Verify the Google Token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const googlePayload = ticket.getPayload();
  if (!googlePayload || !googlePayload.email) {
    return {
      status: StatusCodes.UNAUTHORIZED,
      message: "Invalid Google Token",
    };
  }

  const { email, name, sub: googleId, picture } = googlePayload;

  // 2. Check if user already exists (Continue with Google)
  let user = await User.findOne({ email });

  if (user) {
    // If they signed up with a PIN previously, link their Google account
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = "google";
      await user.save();
    }

    // Standard login checks
    if (user.accountStatus === "deactivated") {
      return { status: StatusCodes.FORBIDDEN, message: "Account deactivated" };
    }
    if (user.accountStatus === "suspended") {
      return { status: StatusCodes.FORBIDDEN, message: "Account suspended" };
    }
  } else {
    // 3. User does not exist (Sign up with Google)
    // For a ride-hailing app, we need to know their role and phone number
    if (!role || !["passenger", "driver"].includes(role)) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Role is required for new accounts",
      };
    }
    if (!phoneNumber) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Phone number is required for new accounts",
      };
    }

    user = await User.create({
      name,
      email,
      phoneNumber,
      role,
      googleId,
      authProvider: "google",
      profileImage: picture,
      emailVerified: true, // Google already verified their email
    });
  }

  // 4. Generate Session / Tokens (Same as your normal login)
  const tokenUser = {
    _id: user._id,
    name: user.name,
    role: user.role,
    accountStatus: user.accountStatus,
  };

  const refreshToken = crypto.randomBytes(40).toString("hex");
  await Token.create({ refreshToken, ip, userAgent, user: user._id });

  return {
    status: StatusCodes.OK,
    message: "Google authentication successful",
    cookieData: { user: tokenUser, refreshToken },
  };
};
