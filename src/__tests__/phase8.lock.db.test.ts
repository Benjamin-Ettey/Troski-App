import SchedulerLock from "../models/SchedulerLock";
import {
  tryAcquireLock,
  releaseLock,
  runSingleton,
} from "../services/scheduler/leaderLock";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

beforeAll(async () => {
  await connectTestDb();
  await SchedulerLock.createIndexes();
});
afterAll(async () => {
  await closeTestDb();
});
afterEach(async () => {
  await clearDb();
});

describe("Phase 8 — leader lock (single-runner across instances)", () => {
  it("lets only one holder hold a lock, then frees it on release", async () => {
    expect(await tryAcquireLock("job", 60000)).toBe(true);
    expect(await tryAcquireLock("job", 60000)).toBe(false); // held
    await releaseLock("job");
    expect(await tryAcquireLock("job", 60000)).toBe(true); // free again
  });

  it("re-acquires an expired lock", async () => {
    await tryAcquireLock("job", -1); // already expired
    expect(await tryAcquireLock("job", 60000)).toBe(true);
  });

  it("runSingleton runs when the lock is free", async () => {
    let ran = false;
    const did = await runSingleton("job2", 60000, async () => {
      ran = true;
    });
    expect(did).toBe(true);
    expect(ran).toBe(true);
  });

  it("runSingleton skips when the lock is already held elsewhere", async () => {
    await tryAcquireLock("job3", 60000); // another holder holds it
    let ran = false;
    const did = await runSingleton("job3", 60000, async () => {
      ran = true;
    });
    expect(did).toBe(false);
    expect(ran).toBe(false);
  });
});
