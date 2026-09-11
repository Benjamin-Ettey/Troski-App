// Thin wrapper around the Google Directions API.
//
// We call this ONCE when a driver goes online (start → destination) and
// cache the resulting polyline + road distance + duration on the Trip, so
// per-passenger matching is then pure local math with no further API calls.
//
// If GOOGLE_MAPS_API_KEY isn't set (or the request fails), getRoute returns
// null and callers fall back to the straight-line heuristic.

const axios = require("axios");

const DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";

/**
 * @param {{latitude:number, longitude:number}} origin
 * @param {{latitude:number, longitude:number}} destination
 * @returns {Promise<null | { encodedPolyline:string, distanceKm:number, durationMinutes:number }>}
 */
async function getRoute(origin, destination) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.warn(
      "GOOGLE_MAPS_API_KEY not set — falling back to straight-line route matching.",
    );
    return null;
  }

  try {
    const { data } = await axios.get(DIRECTIONS_URL, {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: "driving",
        key,
      },
      timeout: 8000,
    });

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.warn("Directions API returned no route:", data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs && route.legs[0];
    return {
      encodedPolyline: route.overview_polyline.points,
      distanceKm: leg ? leg.distance.value / 1000 : null,
      durationMinutes: leg ? Math.round(leg.duration.value / 60) : null,
    };
  } catch (err) {
    console.error("Directions API request failed:", err.message);
    return null;
  }
}

module.exports = { getRoute };
