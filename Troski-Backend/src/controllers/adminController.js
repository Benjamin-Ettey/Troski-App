const { StatusCodes } = require("http-status-codes");
const Admin = require("../models/admins");
const Passenger = require("../models/passengers");
const Driver = require("../models/drivers");
const Vehicle = require("../models/vehicles");

const getCurrentAdmin = async (req, res) => {
  const admin = await Admin.findOne({ _id: req.user.adminId });

  const adminWithoutPassword = admin.toJSON();

  res.status(StatusCodes.OK).json({ admin: adminWithoutPassword });
};

const getAllDrivers = async (req, res) => {
  const drivers = await Driver.find({});

  if (!drivers || drivers.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "No driver found" });
  }

  const driversWithoutPinCode = drivers.map((driver) => {
    return driver.toJSON();
  });

  const totalDrivers = await Driver.countDocuments();

  res.status(StatusCodes.OK).json({
    totalDrivers,
    drivers: driversWithoutPinCode,
  });
};

const getAllPassengers = async (req, res) => {
  const passengers = await Passenger.find({});

  if (!passengers || passengers.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No passengers found" });
  }

  const passengersWithoutPinCode = passengers.map((passenger) => {
    return passenger.toJSON();
  });

  const totalPassengers = await Passenger.countDocuments();

  res
    .status(StatusCodes.OK)
    .json({ totalPassengers, passengers: passengersWithoutPinCode });
};

const getAllVehicles = async (req, res) => {
  const { vehicleStatus } = req.query;

  const queryObject = {};

  if (vehicleStatus) {
    queryObject.vehicleStatus = vehicleStatus;
  }

  const vehicles = await Vehicle.find(queryObject);

  if (!vehicles || vehicles.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "No vehicles found" });
  }

  const totalVehicles = await Vehicle.countDocuments();

  res.status(StatusCodes.OK).json({ totalVehicles, vehicles });
};

const updatePassenger = async (req, res) => {
  const { id } = req.params;

  const passenger = await Passenger.findById(id);

  if (!passenger) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Passenger not found" });
  }

  const updatedPassenger = await Passenger.findByIdAndUpdate(id, req.body, {
    runValidators: true,
    new: true,
  });

  res.status(StatusCodes.OK).json({
    msg: "Passenger updated successfully",
    passenger: updatedPassenger,
  });
};

const updateDriver = async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id);

  if (!driver) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Driver not found" });
  }

  const updatedDriver = await Driver.findByIdAndUpdate(id, req.body, {
    runValidators: true,
    new: true,
  });

  res.status(StatusCodes.OK).json({
    msg: "Driver updated successfully",
    driver: updatedDriver,
  });
};

const updateVehicle = async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Vehicle not found" });
  }

  const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, {
    runValidators: true,
    new: true,
  });

  res.status(StatusCodes.OK).json({
    msg: "Vehicle updated successfully",
    vehicle: updatedVehicle,
  });
};

const deleteDriver = async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findByIdAndDelete(id);

  if (!driver) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: `No driver with id ${id}` });
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Driver deleted successfully", driver });
};

const deletePassenger = async (req, res) => {
  const { id } = req.params;

  const passenger = await Passenger.findByIdAndDelete(id);

  if (!passenger) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: `No passenger with id ${id}` });
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Passenger deleted successfully", passenger });
};

const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findByIdAndDelete(id);

  if (!vehicle) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: `No vehicle with id ${id}` });
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Vehicle deleted successfully", vehicle });
};

const getSinglePassenger = async (req, res) => {
  const { id } = req.params;

  const passenger = await Passenger.findById(id);

  if (!passenger) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Passenger not found" });
  }

  res.status(StatusCodes.OK).json({ passenger });
};

const getSingleDriver = async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id);

  if (!driver) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Driver not found" });
  }

  res.status(StatusCodes.OK).json({ driver });
};

const getSingleVehicle = async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Vehicle not found" });
  }

  res.status(StatusCodes.OK).json({ vehicle });
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
  updatePassenger,
  updateDriver,
  updateVehicle,
  deleteDriver,
  deletePassenger,
  deleteVehicle,
  getSinglePassenger,
  getSingleDriver,
  getSingleVehicle,
  approveVehicleDetails,
  rejectVehicleDetails,
};
