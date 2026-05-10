const BASE_FARE = 5;      // GHS
const PER_KM_RATE = 2;    // GHS per km
const MIN_FARE = 8;       // GHS
const COMMISSION_RATE = 0.15; // 15% platform commission

// Haversine formula — returns distance in kilometres
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

// Returns fare in GHS, rounded to 2 decimal places
const calculateFare = (distanceKm) => {
  const raw = BASE_FARE + distanceKm * PER_KM_RATE;
  return parseFloat(Math.max(raw, MIN_FARE).toFixed(2));
};

// Splits fare into commission and driver earnings
const splitFare = (fare) => {
  const commission = parseFloat((fare * COMMISSION_RATE).toFixed(2));
  const driverEarnings = parseFloat((fare - commission).toFixed(2));
  return { commission, driverEarnings };
};

module.exports = { calculateDistance, calculateFare, splitFare, COMMISSION_RATE };
