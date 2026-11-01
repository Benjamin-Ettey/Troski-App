import { getDistance } from "geolib";
import ghanaTownCoordinatesData from "../data/ghanaTownCoordinatesData";
import type { LocationPoint } from "../types/booking.types";

type TownRecord = {
  name: string;
  latitude: number;
  longitude: number;
  zoneID: string;
};

const townMap = new Map<string, TownRecord>();
for (const town of ghanaTownCoordinatesData as readonly TownRecord[]) {
  const key = town.name.trim().toLowerCase();
  if (!townMap.has(key)) {
    townMap.set(key, town);
  }
}

const normalize = (name: string): string => name.trim().toLowerCase();

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

export const nearestTown = (lat: number, lng: number): LocationPoint | null => {
  let best: LocationPoint | null = null;
  let shortestDistance = Infinity;

  for (const record of townMap.values()) {
    const distance = getDistance(
      { latitude: lat, longitude: lng },
      { latitude: record.latitude, longitude: record.longitude },
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
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
