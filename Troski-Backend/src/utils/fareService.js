// Fare computation wrapper used by tripController & driverLocationController.
// Bridges raw lat/lng pairs into zone-based fare via findNearestTown +
// calculateRouteFare + zonesConfig.

const { distanceKm } = require("./geo");
const findNearestTown = require("./findNearestTown");
const calculateRouteFare = require("./calculateRouteFare");
const zonesConfig = require("../data/zonesConfig");

/**
 * Snapshot a per-passenger fare for a given pickup → dropoff.
 * Returns null if zones can't be resolved (callers should reject the request).
 *
 * Output shape:
 *   {
 *     pickupTown, dropoffTown,
 *     pickupZone, dropoffZone,
 *     distanceInKm,
 *     fare,            // per-passenger total (calculateRouteFare.finalFare)
 *     driverPay,       // per-passenger driver cut
 *     platformProfit,  // per-passenger platform cut (commission + flat fee)
 *     breakdown: { commission, platformFee },
 *   }
 */
function computeFare({ pickup, dropoff }) {
  const pickupTown = findNearestTown({
    latitude: pickup.latitude,
    longitude: pickup.longitude,
  });
  const dropoffTown = findNearestTown({
    latitude: dropoff.latitude,
    longitude: dropoff.longitude,
  });
  if (!pickupTown || !dropoffTown) return null;

  const dist = distanceKm(
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
  );

  const r = calculateRouteFare({
    pickupZone: pickupTown.zoneID,
    dropoffZone: dropoffTown.zoneID,
    distanceInKm: dist,
    zonesConfig,
  });

  return {
    pickupTown: pickupTown.name,
    dropoffTown: dropoffTown.name,
    pickupZone: pickupTown.zoneID,
    dropoffZone: dropoffTown.zoneID,
    distanceInKm: dist,
    fare: r.finalFare,
    driverPay: r.driverPay,
    platformProfit: r.troskiProfit,
    breakdown: r.breakdown,
  };
}

module.exports = { computeFare };
