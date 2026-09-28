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
