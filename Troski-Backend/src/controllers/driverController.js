const { StatusCodes } = require("http-status-codes");
const Driver = require("../models/drivers");
const Vehicle = require("../models/vehicles");

// All driver endpoints look up the Driver profile by the logged-in user's
// _id (passengerId in the token payload). Token never holds the Driver._id
// directly — drivers and passengers share one auth flow.

const getCurrentDriver = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId }).populate(
    "user",
    "name phoneNumber email profilePhoto roles",
  );

  if (!driver) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No driver profile for this user" });
  }

  res.status(StatusCodes.OK).json({ driver });
};

const getDriverVehicle = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No driver profile for this user" });
  }

  const vehicle = await Vehicle.findOne({ driver: driver._id });
  if (!vehicle) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Vehicle not found for this driver" });
  }

  res.status(StatusCodes.OK).json({ vehicle });
};

module.exports = { getCurrentDriver, getDriverVehicle };
