import {
  Client,
  TravelMode,
  type LatLngLiteral,
} from "@googlemaps/google-maps-services-js";

/**
 * Thin wrapper around the Google Maps Platform client. All Google access for
 * the app goes through here so the API key, request shaping, response parsing
 * and error handling live in one place.
 *
 * Built via a factory that takes the client + key so tests can inject a fake
 * client (no network, no ESM module mocking). A default `mapsService` singleton
 * is exported for app code.
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

export type DirectionsResult = {
  polyline: string;
  distanceKm: number;
  durationMin: number;
};

const toKm = (meters: number): number => parseFloat((meters / 1000).toFixed(2));
const toMin = (seconds: number): number => Math.round(seconds / 60);

export const createMapsService = (client: Client, apiKey: string) => {
  const requireKey = (): void => {
    if (!apiKey) {
      throw new MapsError("GOOGLE_MAPS_API_KEY is not configured");
    }
  };

  /** Address text → coordinates (for "where am I going" input). */
  const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
    requireKey();
    const res = await client.geocode({ params: { address, key: apiKey } });
    const result = res.data.results?.[0];
    if (!result) {
      throw new MapsError(`No geocoding result for "${address}"`);
    }
    const { lat, lng } = result.geometry.location;
    return {
      lat,
      lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  };

  /** Coordinates → nearest named place (for naming pickup points). */
  const reverseGeocode = async ({
    lat,
    lng,
  }: LatLng): Promise<GeocodeResult> => {
    requireKey();
    const res = await client.reverseGeocode({
      params: { latlng: { lat, lng } as LatLngLiteral, key: apiKey },
    });
    const result = res.data.results?.[0];
    if (!result) {
      throw new MapsError(`No reverse-geocoding result for ${lat},${lng}`);
    }
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    };
  };

  /** Road distance + travel time between two points. */
  const getRoadDistance = async (
    origin: LatLng,
    destination: LatLng,
    mode: TravelMode = TravelMode.driving,
  ): Promise<DistanceResult> => {
    requireKey();
    const res = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        mode,
        key: apiKey,
      },
    });
    const element = res.data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      throw new MapsError(
        `Distance lookup failed: ${element?.status ?? "no result"}`,
      );
    }
    return {
      distanceKm: toKm(element.distance.value),
      durationMin: toMin(element.duration.value),
      distanceText: element.distance.text,
      durationText: element.duration.text,
    };
  };

  /** Full route between two points: encoded polyline + distance + time. */
  const getDirections = async (
    origin: LatLng,
    destination: LatLng,
    mode: TravelMode = TravelMode.driving,
  ): Promise<DirectionsResult> => {
    requireKey();
    const res = await client.directions({
      params: { origin, destination, mode, key: apiKey },
    });
    const route = res.data.routes?.[0];
    const leg = route?.legs?.[0];
    if (!route || !leg) {
      throw new MapsError("No route found");
    }
    return {
      polyline: route.overview_polyline.points,
      distanceKm: toKm(leg.distance.value),
      durationMin: toMin(leg.duration.value),
    };
  };

  return { geocodeAddress, reverseGeocode, getRoadDistance, getDirections };
};

export type MapsService = ReturnType<typeof createMapsService>;

export const isMapsConfigured = (): boolean =>
  !!process.env.GOOGLE_MAPS_API_KEY;

export const mapsService = createMapsService(
  new Client({}),
  process.env.GOOGLE_MAPS_API_KEY || "",
);
