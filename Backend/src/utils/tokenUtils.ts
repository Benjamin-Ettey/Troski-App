import jwt from "jsonwebtoken";
import { Response } from "express";
import { TokenUser } from "../types/user.types";

export const createJWT = ({ payload }: { payload: object }): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not defined.");
  }

  return jwt.sign(payload, jwtSecret);
};

export const isTokenValid = (token: string) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not defined.");
  }

  return jwt.verify(token, jwtSecret);
};

export const attachCookiesToResponse = ({
  res,
  user,
  refreshToken,
}: {
  res: Response;
  user: TokenUser;
  refreshToken: string;
}): void => {
  const accessTokenJWT = createJWT({
    payload: { user },
  });

  const refreshTokenJWT = createJWT({
    payload: { user, refreshToken },
  });

  const fifteenMinutes = 1000 * 60 * 15;
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    signed: true,
    expires: new Date(Date.now() + fifteenMinutes),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    signed: true,
    expires: new Date(Date.now() + thirtyDays),
  });
};
