const { StatusCodes } = require("http-status-codes");
const Driver = require("../models/drivers");
const Vehicle = require("../models/vehicles");
const Ride = require("../models/rides");
const { calculateDistance, calculateFare } = require("../utils/fareCalculation");

const getCurrentDriver = async (req, res) => {
  const driver = await Driver.findById(req.user.driverId).populate("vehicle");

  if (!driver) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Driver not found" });
  }

  res.status(StatusCodes.OK).json({ driver: driver.toJSON() });
};

const getDriverVehicle = async (req, res) => {
  const vehicle = await Vehicle.findOne({ driver: req.user.driverId });

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "No vehicle registered for this driver" });
  }

  res.status(StatusCodes.OK).json({ vehicle });
};

// Driver updates their live location (called periodically from the app)
const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Latitude and longitude are required" });
  }

  await Driver.findByIdAndUpdate(req.user.driverId, {
    currentLatitude: parseFloat(latitude),
    currentLongitude: parseFloat(longitude),
    lastLocationUpdate: new Date(),
  });

  res.status(StatusCodes.OK).json({ msg: "Location updated" });
};

// Driver accepts a ride request
const acceptRide = async (req, res) => {
  const driverId = req.user.driverId;
  const { rideId } = req.params;

  const ride = await Ride.findById(rideId);

  if (!ride) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });
  }

  if (ride.status !== "requested") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Ride is no longer available" });
  }

  const driver = await Driver.findById(driverId);

  if (driver.ride) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "You already have an active ride" });
  }

  // Calculate and store estimated fare
  const distance = calculateDistance(
    ride.pickupLatitude,
    ride.pickupLongitude,
    ride.dropoffLatitude,
    ride.dropoffLongitude
  );

  const estimatedFare = calculateFare(distance);

  ride.driver = driverId;
  ride.status = "accepted";
  ride.distance = distance;
  ride.estimatedFare = estimatedFare;
  await ride.save();

  driver.ride = ride._id;
  await driver.save();

  res.status(StatusCodes.OK).json({
    msg: "Ride accepted",
    ride,
    estimatedFare,
    distance,
  });
};

// Driver starts the ride (passenger is in the vehicle)
const startRide = async (req, res) => {
  const driverId = req.user.driverId;
  const { rideId } = req.params;

  const ride = await Ride.findById(rideId);

  if (!ride || String(ride.driver) !== String(driverId)) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });
  }

  if (ride.status !== "accepted") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Ride cannot be started in its current state" });
  }

  ride.status = "in_progress";
  ride.startedAt = new Date();
  await ride.save();

  res.status(StatusCodes.OK).json({ msg: "Ride started", ride });
};

// Driver completes the ride — fare is finalised
const completeRide = async (req, res) => {
  const driverId = req.user.driverId;
  const { rideId } = req.params;

  const ride = await Ride.findById(rideId);

  if (!ride || String(ride.driver) !== String(driverId)) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });
  }

  if (ride.status !== "in_progress") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Ride is not in progress" });
  }

  const completedAt = new Date();
  const duration = ride.startedAt
    ? Math.round((completedAt - ride.startedAt) / 60000)
    : null;

  ride.status = "completed";
  ride.completedAt = completedAt;
  ride.duration = duration;
  ride.fare = ride.estimatedFare; // use estimated fare as final (can add surge logic later)
  await ride.save();

  // Free up driver for next ride
  await Driver.findByIdAndUpdate(driverId, { $unset: { ride: "" } });

  res.status(StatusCodes.OK).json({
    msg: "Ride completed. Awaiting payment.",
    ride,
    fare: ride.fare,
  });
};

// Driver cancels a ride
const cancelRide = async (req, res) => {
  const driverId = req.user.driverId;
  const { rideId } = req.params;
  const { reason } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride || String(ride.driver) !== String(driverId)) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });
  }

  if (!["accepted", "in_progress"].includes(ride.status)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Cannot cancel this ride" });
  }

  ride.status = "cancelled";
  ride.cancellationReason = reason || "Cancelled by driver";
  await ride.save();

  await Driver.findByIdAndUpdate(driverId, { $unset: { ride: "" } });

  res.status(StatusCodes.OK).json({ msg: "Ride cancelled", ride });
};

module.exports = {
  getCurrentDriver,
  getDriverVehicle,
  updateLocation,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
};
