const calculateDistance = require("./calculateDistance");

const isWithinRadius = ({
  centerLat,
  centerLng,
  targetLat,
  targetLng,
  radiusInKm,
}) => {
  const distance = calculateDistance(
    centerLat,
    centerLng,
    targetLat,
    targetLng,
  );

  return distance <= radiusInKm;
};

module.exports = isWithinRadius;
