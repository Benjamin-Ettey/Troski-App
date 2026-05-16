// Tunable parameters for the ride/demand-aggregation system.
// Keep these here (not scattered in code) so we can tweak them without
// hunting through controllers.

module.exports = {
  // Two passengers within this many METERS of each other (and going to the
  // same dropoff) get auto-grouped into the same Trip.
  // 200m ~ 2-3 minutes of walking, roughly one city block in Accra.
  CLUSTER_RADIUS_METERS: 200,

  // Minimum number of bookings before a Trip becomes visible to drivers.
  // Drivers don't take groups smaller than this — not worth the diversion.
  MIN_PASSENGERS_FOR_DRIVERS: 5,

  // Driver must be within this radius (km) of the pickup centroid to see
  // a Trip in their available list. Filters out drivers too far to help.
  DRIVER_SEARCH_RADIUS_KM: 5,

  // A passenger booking is auto-cancelled if their Trip stays in "forming"
  // (below the 5-passenger threshold) for this long.
  FORMING_TIMEOUT_MS: 15 * 60 * 1000, // 15 minutes

  // A Trip that hit the threshold but has no driver accept it within this
  // window auto-cancels and refunds all passengers.
  OPEN_FOR_DRIVERS_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes

  // Driver location updates older than this are considered stale and the
  // driver is treated as offline for matching purposes.
  DRIVER_LOCATION_STALE_MS: 60 * 1000, // 60 seconds

  // A driver who arrives within this many METERS of the pickup centroid
  // is considered "at pickup".
  ARRIVED_AT_PICKUP_THRESHOLD_METERS: 50,

  // A driver who reaches within this many METERS of the dropoff is
  // considered to have completed the ride.
  ARRIVED_AT_DROPOFF_THRESHOLD_METERS: 80,
};
