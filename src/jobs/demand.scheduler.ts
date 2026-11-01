import cron from "node-cron";
import { runClustering } from "../services/booking/demand.service";
import { runSingleton } from "../services/scheduler/leaderLock";

const LOCK_TTL_MS = 2 * 60 * 1000;

let started = false;
let running = false;

export const startDemandScheduler = (): void => {
  if (started) return;
  const schedule = process.env.DEMAND_CRON || "*/2 * * * *"; // every 2 minutes
  if (!cron.validate(schedule)) {
    console.error(`[demand] invalid DEMAND_CRON "${schedule}" — scheduler off`);
    return;
  }
  cron.schedule(schedule, async () => {
    if (running) return;
    running = true;
    try {
      await runSingleton("demand-clustering", LOCK_TTL_MS, async () => {
        const { clustersFormed } = await runClustering();
        if (clustersFormed)
          console.log(`[demand] formed ${clustersFormed} cluster(s)`);
      });
    } catch (err) {
      console.error("[demand] clustering failed", err);
    } finally {
      running = false;
    }
  });
  started = true;
  console.log(`[demand] scheduler started (${schedule})`);
};
