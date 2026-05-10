const jwt = require("jsonwebtoken");

const createJWT = ({ payload, expiresIn }) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachPassengerCookiesToResponse = ({ res, passenger, refreshToken }) => {
  const fifteenMins = 1000 * 60 * 15;
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  const accessTokenJWT = createJWT({ payload: { passenger }, expiresIn: "15m" });
  const refreshTokenJWT = createJWT({ payload: { passenger, refreshToken }, expiresIn: "30d" });

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + fifteenMins),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + thirtyDays),
  });
};

const attachDriverCookiesToResponse = ({ res, driver, refreshToken }) => {
  const fifteenMins = 1000 * 60 * 15;
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  const accessTokenJWT = createJWT({ payload: { driver }, expiresIn: "15m" });
  const refreshTokenJWT = createJWT({ payload: { driver, refreshToken }, expiresIn: "30d" });

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + fifteenMins),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + thirtyDays),
  });
};

const attachAdminCookiesToResponse = ({ res, admin, refreshToken }) => {
  const fifteenMins = 1000 * 60 * 15;
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  const accessTokenJWT = createJWT({ payload: { admin }, expiresIn: "15m" });
  const refreshTokenJWT = createJWT({ payload: { admin, refreshToken }, expiresIn: "30d" });

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + fifteenMins),
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
  attachDriverCookiesToResponse,
  attachAdminCookiesToResponse,
};
