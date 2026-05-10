const { isTokenValid } = require("../utils/tokenUtils");
const PassengerToken = require("../models/passengerToken");
const DriverToken = require("../models/driverToken");
const AdminToken = require("../models/adminToken");
const {
  attachPassengerCookiesToResponse,
  attachDriverCookiesToResponse,
  attachAdminCookiesToResponse,
} = require("../utils/tokenUtils");
const { StatusCodes } = require("http-status-codes");

const authenticatePassenger = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      try {
        const payload = isTokenValid(accessToken);
        req.user = payload.passenger;
        return next();
      } catch {
        // access token expired — fall through to refresh token
      }
    }

    const payload = isTokenValid(refreshToken);

    const existingToken = await PassengerToken.findOne({
      passenger: payload.passenger.passengerId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken.isValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
    }

    const newRefreshToken = require("crypto").randomBytes(40).toString("hex");

    existingToken.refreshToken = newRefreshToken;
    await existingToken.save();

    attachPassengerCookiesToResponse({
      res,
      passenger: payload.passenger,
      refreshToken: newRefreshToken,
    });

    req.user = payload.passenger;
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication Invalid" });
  }
};

const authenticateDriver = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      try {
        const payload = isTokenValid(accessToken);
        req.user = payload.driver;
        return next();
      } catch {
        // access token expired — fall through to refresh token
      }
    }

    const payload = isTokenValid(refreshToken);

    const existingToken = await DriverToken.findOne({
      driver: payload.driver.driverId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken.isValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
    }

    const newRefreshToken = require("crypto").randomBytes(40).toString("hex");

    existingToken.refreshToken = newRefreshToken;
    await existingToken.save();

    attachDriverCookiesToResponse({
      res,
      driver: payload.driver,
      refreshToken: newRefreshToken,
    });

    req.user = payload.driver;
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication Invalid" });
  }
};

const authenticateAdmin = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      try {
        const payload = isTokenValid(accessToken);
        req.user = payload.admin;
        return next();
      } catch {
        // access token expired — fall through to refresh token
      }
    }

    const payload = isTokenValid(refreshToken);

    const existingToken = await AdminToken.findOne({
      admin: payload.admin.adminId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken.isValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
    }

    const newRefreshToken = require("crypto").randomBytes(40).toString("hex");

    existingToken.refreshToken = newRefreshToken;
    await existingToken.save();

    attachAdminCookiesToResponse({
      res,
      admin: payload.admin,
      refreshToken: newRefreshToken,
    });

    req.user = payload.admin;
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication Invalid" });
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Unauthorized to access this route" });
    }
    next();
  };
};

module.exports = {
  authenticatePassenger,
  authenticateDriver,
  authenticateAdmin,
  authorizePermissions,
};
