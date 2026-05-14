const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

const { StatusCodes } = require("http-status-codes");

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.userId);

  res.status(StatusCodes.OK).json({
    user,
  });
};

const getMyVehicle = async (req, res) => {
  const vehicle = await Vehicle.findOne({
    driver: req.user.userId,
  });

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Vehicle not found",
    });
  }

  res.status(StatusCodes.OK).json({
    vehicle,
  });
};

module.exports = {
  getCurrentUser,
  getMyVehicle,
};
