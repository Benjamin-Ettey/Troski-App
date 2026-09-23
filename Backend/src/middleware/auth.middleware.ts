import Token from "../models/Token";
import { isTokenValid, attachCookiesToResponse } from "../utils/tokenUtils";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import { TokenUser } from "../types/user.types";

type AuthPayload = {
  user: TokenUser;
  refreshToken?: string;
};

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken) as AuthPayload;
      req.user = payload.user;
      return next();
    }

    if (!refreshToken) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
      return;
    }

    const payload = isTokenValid(refreshToken) as AuthPayload;

    const existingToken = await Token.findOne({
      user: payload.user._id,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken.isValid) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
      return;
    }

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });

    req.user = payload.user;
    next();
  } catch (error) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication Invalid" });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(StatusCodes.FORBIDDEN).json({
        msg: "Unauthorized to access this route",
      });
      return;
    }

    next();
  };
};
