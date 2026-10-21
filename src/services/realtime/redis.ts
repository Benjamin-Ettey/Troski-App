import Redis from "ioredis";

/**
 * Optional Redis layer, enabled only when REDIS_URL is set. It provides:
 *  - a pub/sub backplane so SSE events reach subscribers on OTHER app instances
 *  - a GEO set for fast "nearby runs" proximity queries
 *
 * When REDIS_URL is absent, every function here is a safe no-op and the app
 * falls back to the in-process SSE hub + MongoDB 2dsphere search (single node).
 */

const SSE_CHANNEL = "troski:sse";
const GEO_KEY = "troski:runs:geo";

let pub: Redis | null = null;
let sub: Redis | null = null;
let enabled = false;

export const isRedisEnabled = (): boolean => enabled;

/** Connect Redis clients if REDIS_URL is configured. Call once at server start. */
export const initRedis = (): void => {
  const url = process.env.REDIS_URL;
  if (!url) return;
  pub = new Redis(url, { maxRetriesPerRequest: 3 });
  sub = new Redis(url);
  enabled = true;
  console.log("[redis] enabled (backplane + GEO)");
};

// ---- SSE backplane transport ----

export const backplanePublish = (payload: string): void => {
  pub?.publish(SSE_CHANNEL, payload);
};

export const backplaneSubscribe = (handler: (payload: string) => void): void => {
  if (!sub) return;
  sub.subscribe(SSE_CHANNEL);
  sub.on("message", (channel, message) => {
    if (channel === SSE_CHANNEL) handler(message);
  });
};

// ---- GEO (live run positions) ----

export const geoUpsert = async (
  runId: string,
  lng: number,
  lat: number,
): Promise<void> => {
  if (!enabled || !pub) return;
  await pub.geoadd(GEO_KEY, lng, lat, runId);
};

export const geoRemove = async (runId: string): Promise<void> => {
  if (!enabled || !pub) return;
  await pub.zrem(GEO_KEY, runId);
};

/**
 * Return run ids within `radiusKm` of a point, nearest-first — or null when
 * Redis is disabled (caller falls back to Mongo 2dsphere).
 */
export const geoNearby = async (
  lng: number,
  lat: number,
  radiusKm: number,
): Promise<string[] | null> => {
  if (!enabled || !pub) return null;
  const ids = (await pub.geosearch(
    GEO_KEY,
    "FROMLONLAT",
    lng,
    lat,
    "BYRADIUS",
    radiusKm,
    "km",
    "ASC",
  )) as string[];
  return ids;
};

/** For graceful shutdown. */
export const closeRedis = async (): Promise<void> => {
  await pub?.quit();
  await sub?.quit();
};
