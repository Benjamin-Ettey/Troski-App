// Fare computation wrapper.
//
// Bridges geographic coordinates -> zone IDs -> per-passenger fare using
// calculateRouteFare + zonesConfig. Used at Trip creation to snapshot
// what every passenger in that trip will pay.

const { distanceKm } = require("./geo");
const findNearestTown = require("./findNearestTown");
const calculateRouteFare = require("./calculateRouteFare");
const zonesConfig = require("../data/zonesConfig");

/**
 * Compute the per-passenger fare for a trip given pickup + dropoff coords.
 *
 * Returns null if the zones can't be determined (e.g. coords are way off
 * Ghana's bounding box and findNearestTown returns nothing). Callers
 * should treat that as "we can't price this trip; reject the request".
 *
 * Returned shape:
 *   {
 *     pickupTown, dropoffTown,
 *     pickupZone, dropoffZone,
 *     distanceInKm,
 *     fare,            // = what each passenger pays (calculateRouteFare.finalFare)
 *     driverPay,       // what driver gets per passenger
 *     platformProfit,  // platform's cut per passenger (commission + flat platform fee)
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
