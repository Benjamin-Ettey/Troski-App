// Driver online/offline + location updates.
//
// Drivers can update their location two ways:
//  - via socket event "driver:location"  (preferred; real-time)
//  - via HTTP POST /driver-location       (fallback / polling clients)
// Both paths funnel through the same DriverLocation upsert.

const { StatusCodes } = require("http-status-codes");
const Driver = require("../models/drivers");
const DriverLocation = require("../models/driverLocations");
const { isInGhana } = require("../utils/geo");

const goOnline = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "No driver profile for this user" });
  }
  if (!driver.vehicle) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "You need an approved vehicle before going online.",
    });
  }

  const { latitude, longitude } = req.body || {};
  if (!isInGhana(latitude, longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid location coordinates are required" });
  }

  const now = new Date();
  const location = await DriverLocation.findOneAndUpdate(
    { driver: driver._id },
    {
      $set: {
        latitude,
        longitude,
        isOnline: true,
        lastUpdate: now,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.status(StatusCodes.OK).json({ msg: "Online", location });
};

const goOffline = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });
  }
  await DriverLocation.findOneAndUpdate(
    { driver: driver._id },
    { $set: { isOnline: false, socketId: null, lastUpdate: new Date() } },
  );
  res.status(StatusCodes.OK).json({ msg: "Offline" });
};

const updateLocation = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });
  }

  const { latitude, longitude, heading, speed } = req.body || {};
  if (!isInGhana(latitude, longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid location coordinates are required" });
  }

  const location = await DriverLocation.findOneAndUpdate(
    { driver: driver._id, isOnline: true },
    {
      $set: {
        latitude,
        longitude,
        heading: heading ?? null,
        speed: speed ?? null,
        lastUpdate: new Date(),
      },
    },
    { new: true },
  );

  if (!location) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Go online before pushing location updates" });
  }

  res.status(StatusCodes.OK).json({ msg: "Location updated", location });
};

module.exports = { goOnline, goOffline, updateLocation };
