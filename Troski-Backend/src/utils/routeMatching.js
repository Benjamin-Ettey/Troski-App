// Route-matching helpers for "is this passenger's pickup/drop-off enroute?"
//
// Primary path uses a cached Google Directions polyline on the Trip.
// Fallback path (no polyline) uses a straight-line detour heuristic.

const { distanceMeters, distanceKm } = require("./geo");
const { decodePolyline } = require("./polyline");

// How far off the route a point can be and still count as "on the route".
// Accounts for GPS noise + the fact that pickup/drop-off pins sit at the
// roadside, not on the road centerline.
const ON_ROUTE_TOLERANCE_METERS = 300;

// Straight-line fallback: how much extra distance going via D is allowed.
const DETOUR_TOLERANCE = 0.25; // 25%

/**
 * Decode a polyline and annotate each vertex with cumulative distance from
 * the route start (in meters). Returns [] for empty/invalid input.
 */
function prepareRoute(encodedPolyline) {
  const pts = decodePolyline(encodedPolyline);
  let cum = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) {
      cum += distanceMeters(
        pts[i - 1].latitude,
        pts[i - 1].longitude,
        pts[i].latitude,
        pts[i].longitude,
      );
    }
    pts[i].cumMeters = cum;
  }
  return pts;
}

/**
 * Project a point onto the prepared route by nearest vertex. Google
 * polylines are dense enough that nearest-vertex is a fine approximation.
 * Returns { perpMeters, alongMeters } or null if route is empty.
 */
function projectToRoute(point, preparedRoute) {
  if (!preparedRoute || preparedRoute.length === 0) return null;
  let bestDist = Infinity;
  let bestAlong = 0;
  for (const node of preparedRoute) {
    const d = distanceMeters(
      point.latitude,
      point.longitude,
      node.latitude,
      node.longitude,
    );
    if (d < bestDist) {
      bestDist = d;
      bestAlong = node.cumMeters;
    }
  }
  return { perpMeters: bestDist, alongMeters: bestAlong };
}

/**
 * Decide whether a passenger's pickup + drop-off are enroute for a trip,
 * and compute the along-route distance the passenger will travel (used for
 * fare). Uses the cached polyline if present; otherwise straight-line.
 *
 * @returns {{
 *   match: boolean,
 *   reason?: string,
 *   fareDistanceKm?: number,
 *   pickupAlongKm?: number,
 *   dropoffAlongKm?: number,
 * }}
 */
function evaluateEnroute({
  pickup,
  dropoff,
  encodedPolyline,
  driverLocation, // {latitude, longitude} — current driver position
  finalDestination, // {latitude, longitude} — trip dropoff
}) {
  // ---- Primary: polyline-based ----
  if (encodedPolyline) {
    const route = prepareRoute(encodedPolyline);
    if (route.length >= 2) {
      const pProj = projectToRoute(pickup, route);
      const dProj = projectToRoute(dropoff, route);

      if (!pProj || pProj.perpMeters > ON_ROUTE_TOLERANCE_METERS) {
        return { match: false, reason: "pickup is not on the trip's route" };
      }
      if (!dProj || dProj.perpMeters > ON_ROUTE_TOLERANCE_METERS) {
        return { match: false, reason: "drop-off is not on the trip's route" };
      }
      if (dProj.alongMeters <= pProj.alongMeters) {
        return {
          match: false,
          reason: "drop-off is behind your pickup along this route",
        };
      }

      // Optional: ensure the driver hasn't already passed the pickup.
      if (driverLocation) {
        const driverProj = projectToRoute(driverLocation, route);
        if (driverProj && driverProj.alongMeters > pProj.alongMeters + 50) {
          return {
            match: false,
            reason: "the driver has already passed your pickup point",
          };
        }
      }

      const fareDistanceKm =
        (dProj.alongMeters - pProj.alongMeters) / 1000;
      return {
        match: true,
        fareDistanceKm,
        pickupAlongKm: pProj.alongMeters / 1000,
        dropoffAlongKm: dProj.alongMeters / 1000,
      };
    }
  }

  // ---- Fallback: straight-line detour heuristic ----
  if (!finalDestination) {
    return { match: false, reason: "no route information available" };
  }
  const origin = driverLocation || pickup;
  const pToD = distanceKm(
    origin.latitude,
    origin.longitude,
    dropoff.latitude,
    dropoff.longitude,
  );
  const dToF = distanceKm(
    dropoff.latitude,
    dropoff.longitude,
    finalDestination.latitude,
    finalDestination.longitude,
  );
  const pToF = distanceKm(
    origin.latitude,
    origin.longitude,
    finalDestination.latitude,
    finalDestination.longitude,
  );

  if (dToF >= pToF) {
    return { match: false, reason: "drop-off is not ahead toward the destination" };
  }
  if (pToD + dToF > pToF * (1 + DETOUR_TOLERANCE)) {
    return { match: false, reason: "drop-off is too far off the route" };
  }

  // Fare distance ≈ passenger's pickup→dropoff straight-line distance.
  const fareDistanceKm = distanceKm(
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
  );
  return { match: true, fareDistanceKm };
}

module.exports = {
  prepareRoute,
  projectToRoute,
  evaluateEnroute,
  ON_ROUTE_TOLERANCE_METERS,
};
