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

  if (result.cookieData) {
    attachCookiesToResponse({
      res,
      user: result.cookieData.user,
      refreshToken: result.cookieData.refreshToken,
    });
  }

  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
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

  if (result.cookieData) {
    attachCookiesToResponse({
      res,
      user: result.cookieData.user,
      refreshToken: result.cookieData.refreshToken,
    });
  }

  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
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

  if (result.cookieData) attachCookiesToResponse({ res, ...result.cookieData });
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
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

  if (result.cookieData) attachCookiesToResponse({ res, ...result.cookieData });
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
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

export const registerAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.registerAdminService(
    req.body,
    req.ip || "",
    req.headers["user-agent"],
  );

  if (result.cookieData) {
    attachCookiesToResponse({
      res,
      user: result.cookieData.user,
      refreshToken: result.cookieData.refreshToken,
    });
  }

  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
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

  if (result.cookieData) attachCookiesToResponse({ res, ...result.cookieData });
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
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

  if (result.cookieData) attachCookiesToResponse({ res, ...result.cookieData });

  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};
