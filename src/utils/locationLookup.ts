import ghanaTownCoordinatesData from "../data/ghanaTownCoordinatesData";
import type { LocationPoint } from "../types/booking.types";

type TownRecord = {
  name: string;
  latitude: number;
  longitude: number;
  zoneID: string;
};

// Build a case-insensitive lookup map once at module load. Where the same town
// name appears more than once in the dataset, the first occurrence wins.
const townMap = new Map<string, TownRecord>();
for (const town of ghanaTownCoordinatesData as readonly TownRecord[]) {
  const key = town.name.trim().toLowerCase();
  if (!townMap.has(key)) {
    townMap.set(key, town);
  }
}

const normalize = (name: string): string => name.trim().toLowerCase();

/**
 * Resolve a town name to its coordinates and pricing zone.
 * Returns null when the town is not part of the supported dataset.
 */
export const resolveTown = (name: string): LocationPoint | null => {
  if (!name) return null;
  const record = townMap.get(normalize(name));
  if (!record) return null;
  return {
    town: record.name,
    zoneId: record.zoneID,
    latitude: record.latitude,
    longitude: record.longitude,
  };
};

export const isSupportedTown = (name: string): boolean =>
  townMap.has(normalize(name));

/**
 * Resolve a place from EITHER coordinates (the app's map/place picker) OR a town
 * name. Coordinates are first-class: we keep the exact point and borrow only the
 * pricing *zone* from the nearest dataset town — so a passenger/driver can pick
 * anywhere on the map, not just a listed town. A town name still works as a
 * convenience. Returns null if neither is usable.
 */
export const resolvePlace = (input: {
  lat?: number;
  lng?: number;
  town?: string;
}): LocationPoint | null => {
  if (input.lat != null && input.lng != null) {
    const near = nearestTown(input.lat, input.lng);
    return {
      town: near?.town ?? "Dropped pin",
      zoneId: near?.zoneId ?? "REGIONAL_RURAL",
      latitude: input.lat,
      longitude: input.lng,
    };
  }
  if (input.town) return resolveTown(input.town);
  return null;
};

/**
 * Nearest supported town to a coordinate — used to derive a pricing zone for an
 * arbitrary GPS pickup point. O(n) scan over the dataset; fine at MVP scale.
 */
export const nearestTown = (lat: number, lng: number): LocationPoint | null => {
  let best: LocationPoint | null = null;
  let bestDistance = Infinity;
  for (const record of townMap.values()) {
    const d = haversineKm(lat, lng, record.latitude, record.longitude);
    if (d < bestDistance) {
      bestDistance = d;
      best = {
        town: record.name,
        zoneId: record.zoneID,
        latitude: record.latitude,
        longitude: record.longitude,
      };
    }
  }
  return best;
};

const EARTH_RADIUS_KM = 6371;
const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates in kilometres. Used to feed
 * `distanceInKm` into the fare service.
 */
export const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};
