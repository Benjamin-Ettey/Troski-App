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
      const payload = isTokenValid(accessToken);
      req.user = payload.passenger;
      return next();
    }
    const payload = isTokenValid(refreshToken);

    const existingToken = await PassengerToken.findOne({
      passenger: payload.passenger.passengerId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken?.isValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
    }

    attachPassengerCookiesToResponse({
      res,
      passenger: payload.passenger,
      refreshToken: existingToken.refreshToken,
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
      const payload = isTokenValid(accessToken);
      req.user = payload.driver;
      return next();
    }
    const payload = isTokenValid(refreshToken);

    const existingToken = await DriverToken.findOne({
      driver: payload.driver.driverId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken?.isValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
    }

    attachDriverCookiesToResponse({
      res,
      driver: payload.driver,
      refreshToken: existingToken.refreshToken,
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
      const payload = isTokenValid(accessToken);
      req.user = payload.admin;
      return next();
    }
    const payload = isTokenValid(refreshToken);

    const existingToken = await AdminToken.findOne({
      admin: payload.admin.adminId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken || !existingToken?.isValid) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "Authentication Invalid" });
    }

    attachAdminCookiesToResponse({
      res,
      admin: payload.admin,
      refreshToken: existingToken.refreshToken,
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
      throw new CustomError.UnauthorizedError(
        "Unauthorized to access this route",
      );
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
