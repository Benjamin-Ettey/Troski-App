import { Request, Response } from "express";
import { attachCookiesToResponse } from "../utils/tokenUtils";
import { StatusCodes } from "http-status-codes";
import * as authService from "../services/auth/local/auth.service";
import { googleAuthService } from "../services/auth/google/googleAuth.service";

export const requestSmsOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { phoneNumber } = req.body;
  const result = await authService.requestOtpService(
    phoneNumber,
    "sms",
    "signup",
  );
  res.status(result.status).json({ message: result.message });
};

export const requestEmailOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, name } = req.body;
  const result = await authService.requestOtpService(
    email,
    "email",
    "signup",
    name,
  );
  res.status(result.status).json({ message: result.message });
};

export const registerPassenger = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.registerPassengerService(
    req.body,
    req.ip || "",
    req.headers["user-agent"],
  );
  let tokens;
  if (result.cookieData) {
    tokens = attachCookiesToResponse({ res, ...result.cookieData });
  }
  res.status(result.status).json({
    message: result.message,
    data: result.data,
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });
};

export const registerDriver = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.registerDriverService(
    req.body,
    req.ip || "",
    req.headers["user-agent"],
  );
  let tokens;
  if (result.cookieData) {
    tokens = attachCookiesToResponse({ res, ...result.cookieData });
  }
  res.status(result.status).json({
    message: result.message,
    data: result.data,
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });
};

export const loginPassenger = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.loginUserService(
    { ...req.body, expectedRole: "passenger" },
    req.ip || "",
    req.headers["user-agent"],
  );
  let tokens;
  if (result.cookieData) {
    tokens = attachCookiesToResponse({ res, ...result.cookieData });
  }
  res.status(result.status).json({
    message: result.message,
    data: result.data,
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });
};

export const loginDriver = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.loginUserService(
    { ...req.body, expectedRole: "driver" },
    req.ip || "",
    req.headers["user-agent"],
  );
  let tokens;
  if (result.cookieData) {
    tokens = attachCookiesToResponse({ res, ...result.cookieData });
  }
  res.status(result.status).json({
    message: result.message,
    data: result.data,
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });
};

export const registerAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.registerAdminService(
    req.body,
    req.ip || "",
    req.headers["user-agent"],
  );
  let tokens;
  if (result.cookieData) {
    tokens = attachCookiesToResponse({ res, ...result.cookieData });
  }
  res.status(result.status).json({
    message: result.message,
    data: result.data,
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });
};

export const loginAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.loginAdminService(
    req.body,
    req.ip || "",
    req.headers["user-agent"],
  );
  let tokens;
  if (result.cookieData) {
    tokens = attachCookiesToResponse({ res, ...result.cookieData });
  }
  res.status(result.status).json({
    message: result.message,
    data: result.data,
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });
};

export const googleAuth = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await googleAuthService(
    req.body,
    req.ip || "",
    req.headers["user-agent"],
  );
  let tokens;
  if (result.cookieData) {
    tokens = attachCookiesToResponse({ res, ...result.cookieData });
  }
  res.status(result.status).json({
    message: result.message,
    data: result.data,
    ...(tokens && {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  });
};

export const logoutUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (req.user) {
    await authService.logoutUserService(req.user._id.toString());
  }

  // Clear cookies by setting immediate expiration
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ message: "Logged out successfully" });
};

export const requestForgotPinSmsOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { phoneNumber } = req.body;
  const result = await authService.requestOtpService(
    phoneNumber,
    "sms",
    "forgot-pin" as any,
  );
  res.status(result.status).json({ message: result.message });
};

export const requestForgotPinEmailOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, name } = req.body;
  const result = await authService.requestOtpService(
    email,
    "email",
    "forgot-pin",
    name,
  );
  res.status(result.status).json({ message: result.message });
};

export const forgotPinPassenger = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.forgotPinService({
    ...req.body,
    expectedRole: "passenger",
  });
  res.status(result.status).json({ message: result.message });
};

export const forgotPinDriver = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.forgotPinService({
    ...req.body,
    expectedRole: "driver",
  });
  res.status(result.status).json({ message: result.message });
};

export const changePin = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication required" });
    return;
  }

  const result = await authService.changePinService(
    req.user._id.toString(),
    req.body,
  );

  if (result.status === StatusCodes.OK) {
    // Clear cookies immediately
    res.cookie("accessToken", "logout", {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
    res.cookie("refreshToken", "logout", {
      httpOnly: true,
      expires: new Date(Date.now()),
    });
  }

  res.status(result.status).json({ message: result.message });
};

export const refreshUserToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Mobile sends in body, fallback to web cookie if someone hits this endpoint
  const refreshTokenStr =
    req.body.refreshToken || req.signedCookies?.refreshToken;

  if (!refreshTokenStr) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Refresh token is missing" });
    return;
  }

  const result = await authService.refreshUserTokenService(
    refreshTokenStr,
    req.ip || "",
    req.headers["user-agent"],
  );

  if (result.status !== StatusCodes.OK || !result.cookieData) {
    res.status(result.status).json({ message: result.message });
    return;
  }

  // Creates new JWTs and sets cookies (for web fallback)
  const tokens = attachCookiesToResponse({
    res,
    user: result.cookieData.user,
    refreshToken: result.cookieData.refreshToken,
  });

  // Return new JSON tokens for mobile
  res.status(StatusCodes.OK).json({
    message: "Token refreshed successfully",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
};
