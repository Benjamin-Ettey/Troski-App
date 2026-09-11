// Geo helpers used by the ride system.

/**
 * Haversine distance between two lat/lng pairs.
 * Returns distance in METERS.
 */
const distanceMeters = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }
  const R = 6371000; // earth radius in meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const distanceKm = (lat1, lon1, lat2, lon2) =>
  distanceMeters(lat1, lon1, lat2, lon2) / 1000;

/**
 * Compute the simple centroid (mean lat/lng) of an array of points.
 * `points` is [{ latitude, longitude }, ...]
 */
const centroidOf = (points) => {
  if (!points || points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({
      lat: acc.lat + p.latitude,
      lng: acc.lng + p.longitude,
    }),
    { lat: 0, lng: 0 },
  );
  return {
    latitude: sum.lat / points.length,
    longitude: sum.lng / points.length,
  };
};

/**
 * Validate that a coordinate falls within Ghana's rough bounding box.
 * Used to reject obviously bogus coordinates before doing work with them.
 *   Lat:  4.5  ..  11.5
 *   Lng: -3.5  ..  1.5
 */
const isInGhana = (lat, lng) =>
  lat >= 4.5 && lat <= 11.5 && lng >= -3.5 && lng <= 1.5;

module.exports = { distanceMeters, distanceKm, centroidOf, isInGhana };
