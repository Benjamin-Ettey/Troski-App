const jwt = require("jsonwebtoken");

const createJWT = ({ payload }) => {
  return jwt.sign(payload, process.env.JWT_SECRET);
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachPassengerCookiesToResponse = ({ res, passenger, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { passenger } });
  const refreshTokenJWT = createJWT({ payload: { passenger, refreshToken } });

  const fifteenMins = 1000 * 60 * 15;
  const longerExp = 1000 * 60 * 60 * 24 * 30;

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
    expires: new Date(Date.now() + longerExp),
  });
};

const attachDriverCookiesToResponse = ({ res, driver, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { driver } });
  const refreshTokenJWT = createJWT({ payload: { driver, refreshToken } });

  const fifteenMins = 1000 * 60 * 15;
  const longerExp = 1000 * 60 * 60 * 24 * 30;

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
    expires: new Date(Date.now() + longerExp),
  });
};

const attachAdminCookiesToResponse = ({ res, admin, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { admin } });
  const refreshTokenJWT = createJWT({ payload: { admin, refreshToken } });

  const fifteenMins = 1000 * 60 * 15;
  const longerExp = 1000 * 60 * 60 * 24 * 30;

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
    expires: new Date(Date.now() + longerExp),
  });
};
// const attachSingleCookieToResponse = ({ res, user }) => {
//   const token = createJWT({ payload: user });

//   const oneDay = 1000 * 60 * 60 * 24;

//   res.cookie('token', token, {
//     httpOnly: true,
//     expires: new Date(Date.now() + oneDay),
//     secure: process.env.NODE_ENV === 'production',
//     signed: true,
//   });
// };

module.exports = {
  createJWT,
  isTokenValid,
  attachPassengerCookiesToResponse,
  attachDriverCookiesToResponse,
  attachAdminCookiesToResponse,
};
