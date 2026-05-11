const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

const { StatusCodes } = require("http-status-codes");

const getCurrentAdmin = async (req, res) => {
  const admin = await User.findById(req.user.userId);

  res.status(StatusCodes.OK).json({
    admin,
  });
};

const getAllDrivers = async (req, res) => {
  const drivers = await User.find({
    role: "driver",
  });

  res.status(StatusCodes.OK).json({
    totalDrivers: drivers.length,
    drivers,
  });
};

const getAllPassengers = async (req, res) => {
  const passengers = await User.find({
    role: "passenger",
  });

  res.status(StatusCodes.OK).json({
    totalPassengers: passengers.length,
    passengers,
  });
};

const getAllVehicles = async (req, res) => {
  const vehicles = await Vehicle.find({});

  res.status(StatusCodes.OK).json({
    totalVehicles: vehicles.length,
    vehicles,
  });
};

const approveVehicleDetails = async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Vehicle not found",
    });
  }

  if (vehicle.vehicleStatus !== "pending") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Vehicle has already been ${vehicle.vehicleStatus}`,
    });
  }

  vehicle.vehicleStatus = "approved";
  vehicle.reviewedAt = new Date();

  await vehicle.save();

  res.status(StatusCodes.OK).json({
    msg: "Vehicle details approved successfully",
    vehicle,
  });
};

const rejectVehicleDetails = async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Vehicle not found",
    });
  }

  if (vehicle.vehicleStatus !== "pending") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Vehicle has already been ${vehicle.vehicleStatus}`,
    });
  }

  vehicle.vehicleStatus = "rejected";
  vehicle.reviewedAt = new Date();

  await vehicle.save();

  res.status(StatusCodes.OK).json({
    msg: "Vehicle details rejected successfully",
    vehicle,
  });
};

module.exports = {
  getCurrentAdmin,
  getAllDrivers,
  getAllPassengers,
  getAllVehicles,
  approveVehicleDetails,
  rejectVehicleDetails,
};
