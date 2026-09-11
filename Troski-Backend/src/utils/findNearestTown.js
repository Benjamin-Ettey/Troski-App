const { getDistance } = require("geolib");
const ghanaTownCoordinatesData = require("../data/ghanaTownCoordinatesData");

// Brute-force nearest-town lookup. Iterates the entire town array and
// picks the one with minimum geodesic distance. Acceptable at our scale
// (a few thousand entries); swap in a spatial index later if needed.
//
// Returns the matching { name, latitude, longitude, zoneID } object,
// or null if the data file is empty.

const findNearestTown = ({ latitude, longitude }) => {
  let nearestTown = null;
  let shortestDistance = Infinity;

  for (const town of ghanaTownCoordinatesData) {
    const distance = getDistance(
      { latitude, longitude },
      { latitude: town.latitude, longitude: town.longitude },
    );
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestTown = town;
    }
  }
  return nearestTown;
};

module.exports = findNearestTown;
