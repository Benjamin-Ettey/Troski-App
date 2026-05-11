const { getDistance } = require("geolib");

const ghanaTownCoordinatesData = require("../data/ghanaTownCoordinatesData");

const findNearestTown = ({ latitude, longitude }) => {
  let nearestTown = null;

  let shortestDistance = Infinity;

  for (const town of ghanaTownCoordinatesData) {
    const distance = getDistance(
      {
        latitude,
        longitude,
      },
      {
        latitude: town.latitude,
        longitude: town.longitude,
      },
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;

      nearestTown = town;
    }
  }

  return nearestTown;
};

module.exports = findNearestTown;
