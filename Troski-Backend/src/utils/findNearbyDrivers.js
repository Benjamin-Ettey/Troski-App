const DriverLocation = require("../models/DriverLocation");

const calculateDistance = require("./calculateDistance");

const findNearbyDrivers = async (pickupLatitude, pickupLongitude) => {
  const drivers = await DriverLocation.find({
    isOnline: true,
  });

  return drivers.filter((driver) => {
    const distance = calculateDistance(
      pickupLatitude,
      pickupLongitude,
      driver.latitude,
      driver.longitude,
    );

    return distance <= 5;
  });
};

module.exports = findNearbyDrivers;
