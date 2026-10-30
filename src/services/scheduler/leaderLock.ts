import crypto from "crypto";
import SchedulerLock from "../../models/SchedulerLock";

// Unique id for this running process.
export const INSTANCE_ID = crypto.randomUUID();

/**
 * Try to acquire a named lock for `ttlMs`. Returns true if this instance got it.
 *
 * Acquire succeeds when no lock row exists or the existing one has expired. If a
 * valid (non-expired) lock is held elsewhere, the upsert hits the unique `key`
 * index and throws a duplicate-key error, which we translate to "not acquired".
 */
export const tryAcquireLock = async (
  key: string,
  ttlMs: number,
): Promise<boolean> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  try {
    await SchedulerLock.findOneAndUpdate(
      { key, expiresAt: { $lt: now } },
      { $set: { holder: INSTANCE_ID, expiresAt } },
      { upsert: true, returnDocument: "after" },
    );
    return true;
  } catch (err: any) {
    if (err?.code === 11000) return false; // held elsewhere, not yet expired
    throw err;
  }
};

/** Release a lock we hold (so the next tick can acquire immediately). */
export const releaseLock = async (key: string): Promise<void> => {
  await SchedulerLock.updateOne(
    { key, holder: INSTANCE_ID },
    { $set: { expiresAt: new Date(0) } },
  );
};

/**
 * Run `fn` only if this instance wins the lock — the single-runner guarantee for
 * scheduled jobs across a multi-instance deployment. Returns true if it ran.
 */
export const runSingleton = async (
  key: string,
  ttlMs: number,
  fn: () => Promise<void>,
): Promise<boolean> => {
  if (!(await tryAcquireLock(key, ttlMs))) return false;
  try {
    await fn();
    return true;
  } finally {
    await releaseLock(key);
  }
};
