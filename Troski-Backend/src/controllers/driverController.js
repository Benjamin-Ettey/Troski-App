const { StatusCodes } = require("http-status-codes");
const Driver = require("../models/drivers");
const Vehicle = require("../models/vehicles");

const getCurrentDriver = async (req, res) => {
  const driver = await Driver.findOne({ _id: req.user.driverId });

  const driverWithoutPinCode = driver.toJSON();

  res.status(StatusCodes.OK).json({ driver: driverWithoutPinCode });
};

const getDriverVehicle = async (req, res) => {
  const driverId = req.user.driverId;

  const vehicle = await Vehicle.findOne({ driver: driverId });

  if(!vehicle){
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Vehicle not found for this driver" });
  }

  res.status(StatusCodes.OK).json({ vehicle });
};

module.exports = { getCurrentDriver, getDriverVehicle };
