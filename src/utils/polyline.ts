import { haversineKm } from "./locationLookup";

export type Point = { lat: number; lng: number };

/**
 * Decode a Google-encoded polyline into a list of { lat, lng } points.
 *
 * WHY THIS EXISTS: The Routes API returns a route's shape not as hundreds of
 * coordinate objects but as one compact ASCII string (the "Encoded Polyline
 * Algorithm Format") to keep responses small. The string stores each point as a
 * zig-zag-encoded *delta* from the previous point, in 5-bit chunks offset by 63.
 * This function reverses that: it reads the chunks, undoes the zig-zag, divides
 * by 1e5 (precision 5 ≈ ~1m), and accumulates the running lat/lng.
 *
 * It is pure + offline (no API key, no network) — the format is Google's, but
 * the decode is a small public algorithm we own because we call Routes over raw
 * REST rather than through Google's SDK. We need the decoded points to find the
 * pickup point on the route (see nearestPointOnPath).
 */
export const decodePolyline = (encoded: string, precision = 5): Point[] => {
  const points: Point[] = [];
  const factor = Math.pow(10, precision);
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 1;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result += (byte & 0x1f) * shift;
      shift *= 32;
    } while (byte >= 0x20);
    lat += result & 1 ? (-result - 1) / 2 : result / 2;

    shift = 1;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result += (byte & 0x1f) * shift;
      shift *= 32;
    } while (byte >= 0x20);
    lng += result & 1 ? (-result - 1) / 2 : result / 2;

    points.push({ lat: lat / factor, lng: lng / factor });
  }

  return points;
};

/**
 * Shortest distance from a point to a single segment (a -> b), returning the
 * exact closest point ON the segment (not just an endpoint).
 *
 * The projection is done in a locally-flat frame: longitude is scaled by
 * cos(latitude) so that 1 unit east equals 1 unit north in ground distance
 * (1° lng shrinks away from the equator). This keeps the projection correct at
 * any latitude. The final distance is measured with haversine.
 */
const nearestPointOnSegment = (
  p: Point,
  a: Point,
  b: Point,
): { point: Point; distanceKm: number } => {
  const k = Math.cos((a.lat * Math.PI) / 180); // lng -> lat scale at this latitude
  const ax = a.lng * k;
  const ay = a.lat;
  const dx = b.lng * k - ax;
  const dy = b.lat - ay;
  const l2 = dx * dx + dy * dy;

  // Degenerate segment (a === b): fall back to the endpoint.
  if (l2 === 0) {
    return { point: a, distanceKm: haversineKm(p.lat, p.lng, a.lat, a.lng) };
  }

  // Project p onto the segment, clamped to stay between a and b.
  let t = ((p.lng * k - ax) * dx + (p.lat - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const point: Point = {
    lat: a.lat + t * (b.lat - a.lat),
    lng: a.lng + t * (b.lng - a.lng),
  };
  return { point, distanceKm: haversineKm(p.lat, p.lng, point.lat, point.lng) };
};

/** Encode points into a Google polyline string (inverse of decodePolyline). */
export const encodePolyline = (points: Point[], precision = 5): string => {
  const factor = Math.pow(10, precision);
  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  const encodeNumber = (value: number): string => {
    let num = value < 0 ? ~(value << 1) : value << 1;
    let out = "";
    while (num >= 0x20) {
      out += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
      num >>= 5;
    }
    out += String.fromCharCode(num + 63);
    return out;
  };

  for (const pt of points) {
    const lat = Math.round(pt.lat * factor);
    const lng = Math.round(pt.lng * factor);
    result += encodeNumber(lat - lastLat);
    result += encodeNumber(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return result;
};

/**
 * Nearest point on a route to a coordinate. Projects onto every segment (not
 * just the vertices), so the pickup point can land between two polyline points —
 * important where Google returns long straight segments. Returns the closest
 * point, its distance in km, and the index of the segment it lies on (its start
 * vertex), or null for an empty path.
 */
export const nearestPointOnPath = (
  path: Point[],
  lat: number,
  lng: number,
): { point: Point; distanceKm: number; index: number } | null => {
  if (!path.length) return null;
  if (path.length === 1) {
    return {
      point: path[0],
      distanceKm: haversineKm(lat, lng, path[0].lat, path[0].lng),
      index: 0,
    };
  }

  const passenger: Point = { lat, lng };
  let best = { point: path[0], distanceKm: Infinity, index: 0 };

  for (let i = 0; i < path.length - 1; i++) {
    const result = nearestPointOnSegment(passenger, path[i], path[i + 1]);
    if (result.distanceKm < best.distanceKm) {
      best = { point: result.point, distanceKm: result.distanceKm, index: i };
    }
  }

  return best;
};
