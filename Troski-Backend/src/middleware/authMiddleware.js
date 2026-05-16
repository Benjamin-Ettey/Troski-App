const { isTokenValid } = require("../utils/tokenUtils");
const PassengerToken = require("../models/passengerToken");
const AdminToken = require("../models/adminToken");
const {
  attachPassengerCookiesToResponse,
  attachAdminCookiesToResponse,
} = require("../utils/tokenUtils");
const { StatusCodes } = require("http-status-codes");

// Authenticate any end-user (passenger or driver — same collection, just
// different roles).
const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = payload.passenger; // payload key is "passenger" for legacy
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

// Legacy aliases — keep old names working until ride/wallet/payment routers
// are migrated to use authenticateUser + requireRole directly.
const authenticatePassenger = authenticateUser;
const authenticateDriver = [
  authenticateUser,
  (req, res, next) => {
    if (!req.user?.roles?.includes("driver")) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ msg: "Driver role required" });
    }
    next();
  },
];

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

// Require the authenticated user's roles array to include `role`.
// Use AFTER authenticateUser.
const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication required" });
  }
  const roles = req.user.roles || [];
  if (!roles.includes(role)) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: `${role} role required` });
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Super admin privileges required" });
  }
  next();
};

module.exports = {
  authenticateUser,
  authenticatePassenger, // legacy alias
  authenticateDriver, // legacy alias (chain)
  authenticateAdmin,
  requireRole,
  requireSuperAdmin,
};
