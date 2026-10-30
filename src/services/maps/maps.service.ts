/**
 * Google Maps access for the app — the current Routes API (computeRoutes /
 * computeRouteMatrix) for routing/ETA and the Geocoding API for addresses.
 *
 * Built via a factory that takes the API key + an injectable fetch, so tests can
 * supply a fake HTTP layer (no network, no module mocking) — same pattern as the
 * Paystack client. A default `mapsService` singleton is exported for app code.
 *
 * Without a key, methods throw MapsError; callers (fare quote, run start, the
 * matcher) catch it and fall back to straight-line math so the app still runs.
 */

export class MapsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapsError";
  }
}

export type LatLng = { lat: number; lng: number };

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
};

export type DistanceResult = {
  distanceKm: number;
  durationMin: number;
  distanceText: string;
  durationText: string;
};

export type RouteResult = {
  polyline: string;
  distanceKm: number;
  durationMin: number;
};

export type MatrixCell = {
  originIndex: number;
  destinationIndex: number;
  distanceKm: number;
  durationMin: number;
};

// Minimal fetch shape we depend on (keeps DI simple).
export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
const MATRIX_URL =
  "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

const toKm = (meters: number): number => parseFloat((meters / 1000).toFixed(2));
// Routes API durations look like "123s".
const durationToMin = (duration: string | number): number => {
  const seconds =
    typeof duration === "number" ? duration : parseInt(String(duration), 10);
  return Math.round((seconds || 0) / 60);
};

const waypoint = ({ lat, lng }: LatLng) => ({
  location: { latLng: { latitude: lat, longitude: lng } },
});

export const createMapsService = (opts: {
  apiKey: string;
  fetchFn?: FetchLike;
}) => {
  const apiKey = opts.apiKey;
  const doFetch: FetchLike = opts.fetchFn ?? (fetch as unknown as FetchLike);

  const requireKey = (): void => {
    if (!apiKey) throw new MapsError("GOOGLE_MAPS_API_KEY is not configured");
  };

  const geocode = async (params: Record<string, string>): Promise<GeocodeResult> => {
    requireKey();
    const qs = new URLSearchParams({ ...params, key: apiKey }).toString();
    const res = await doFetch(`${GEOCODE_URL}?${qs}`);
    const json = await res.json();
    const result = json.results?.[0];
    if (!result) {
      throw new MapsError(`No geocoding result (${json.status ?? res.status})`);
    }
    const { lat, lng } = result.geometry.location;
    return {
      lat,
      lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  };

  /** Address text -> coordinates. */
  const geocodeAddress = (address: string): Promise<GeocodeResult> =>
    geocode({ address });

  /** Coordinates -> nearest named place (for naming pickup points). */
  const reverseGeocode = ({ lat, lng }: LatLng): Promise<GeocodeResult> =>
    geocode({ latlng: `${lat},${lng}` });

  const computeRoute = async (
    origin: LatLng,
    destination: LatLng,
    travelMode = "DRIVE",
  ): Promise<RouteResult> => {
    requireKey();
    const res = await doFetch(ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: waypoint(origin),
        destination: waypoint(destination),
        travelMode,
        // Live-traffic-aware ETA for driving (ignored for walking).
        ...(travelMode === "DRIVE"
          ? { routingPreference: "TRAFFIC_AWARE" }
          : {}),
      }),
    });
    const json = await res.json();
    const route = json.routes?.[0];
    if (!res.ok || !route) {
      throw new MapsError(
        json?.error?.message || `Route request failed (HTTP ${res.status})`,
      );
    }
    return {
      polyline: route.polyline?.encodedPolyline ?? "",
      distanceKm: toKm(route.distanceMeters ?? 0),
      durationMin: durationToMin(route.duration),
    };
  };

  /** Road distance + travel time between two points (via Routes API). */
  const getRoadDistance = async (
    origin: LatLng,
    destination: LatLng,
  ): Promise<DistanceResult> => {
    const r = await computeRoute(origin, destination);
    return {
      distanceKm: r.distanceKm,
      durationMin: r.durationMin,
      distanceText: `${r.distanceKm} km`,
      durationText: `${r.durationMin} mins`,
    };
  };

  /** Full route between two points: encoded polyline + distance + time. */
  const getDirections = (
    origin: LatLng,
    destination: LatLng,
  ): Promise<RouteResult> => computeRoute(origin, destination);

  /**
   * Many-to-many ETAs in one call (Routes API computeRouteMatrix). Used by the
   * matcher to rank candidate vans by ETA to their pickup points.
   */
  const computeRouteMatrix = async (
    origins: LatLng[],
    destinations: LatLng[],
    travelMode = "DRIVE",
  ): Promise<MatrixCell[]> => {
    requireKey();
    const res = await doFetch(MATRIX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "originIndex,destinationIndex,distanceMeters,duration,condition",
      },
      body: JSON.stringify({
        origins: origins.map((o) => ({ waypoint: waypoint(o) })),
        destinations: destinations.map((d) => ({ waypoint: waypoint(d) })),
        travelMode,
      }),
    });
    const json = await res.json();
    if (!res.ok || !Array.isArray(json)) {
      throw new MapsError(
        json?.error?.message || `Matrix request failed (HTTP ${res.status})`,
      );
    }
    return json
      .filter((c: any) => c.condition !== "ROUTE_NOT_FOUND")
      .map((c: any) => ({
        originIndex: c.originIndex,
        destinationIndex: c.destinationIndex,
        distanceKm: toKm(c.distanceMeters ?? 0),
        durationMin: durationToMin(c.duration),
      }));
  };

  return {
    geocodeAddress,
    reverseGeocode,
    getRoadDistance,
    getDirections,
    computeRoute,
    computeRouteMatrix,
  };
};

export type MapsService = ReturnType<typeof createMapsService>;

export const isMapsConfigured = (): boolean =>
  !!process.env.GOOGLE_MAPS_API_KEY;

export const mapsService = createMapsService({
  apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
});
