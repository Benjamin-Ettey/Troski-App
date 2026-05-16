const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

const createJWT = ({ payload, expiresIn }) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const fifteenMinutes = 1000 * 60 * 15;
const thirtyDays = 1000 * 60 * 60 * 24 * 30;

const attachPassengerCookiesToResponse = ({ res, passenger, refreshToken }) => {
  const accessTokenJWT = createJWT({
    payload: { passenger },
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshTokenJWT = createJWT({
    payload: { passenger, refreshToken },
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + fifteenMinutes),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + thirtyDays),
  });
};

const attachAdminCookiesToResponse = ({ res, admin, refreshToken }) => {
  const accessTokenJWT = createJWT({
    payload: { admin },
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshTokenJWT = createJWT({
    payload: { admin, refreshToken },
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + fifteenMinutes),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + thirtyDays),
  });
};

module.exports = {
  createJWT,
  isTokenValid,
  attachPassengerCookiesToResponse,
  attachAdminCookiesToResponse,
};
