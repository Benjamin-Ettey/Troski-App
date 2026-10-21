import cron from "node-cron";
import { payoutService } from "./payout.service";
import { runSingleton } from "../scheduler/leaderLock";

// Across multiple instances, only the one that wins the lock runs the sweep (so
// payouts never fire twice). The in-process flag avoids overlap on one instance.
let started = false;
let running = false;
const LOCK_TTL_MS = 5 * 60 * 1000;

/** Run a payout sweep, guarded against overlap (local) and duplicates (cluster). */
export const runPayoutsGuarded = async (): Promise<void> => {
  if (running) return;
  running = true;
  try {
    await runSingleton("payouts", LOCK_TTL_MS, async () => {
      const r = await payoutService.runScheduledPayouts();
      console.log(
        `[payouts] processed=${r.processed} paid=${r.paid} skipped=${r.skipped} failed=${r.failed}`,
      );
    });
  } catch (err) {
    console.error("[payouts] run failed", err);
  } finally {
    running = false;
  }
};

/** Start the recurring payout sweep. Call once at server boot. */
export const startPayoutScheduler = (): void => {
  if (started) return;
  const schedule = process.env.PAYOUT_CRON || "0 2 * * *"; // daily at 02:00
  if (!cron.validate(schedule)) {
    console.error(`[payouts] invalid PAYOUT_CRON "${schedule}" — scheduler off`);
    return;
  }
  cron.schedule(schedule, runPayoutsGuarded);
  started = true;
  console.log(`[payouts] scheduler started (${schedule})`);
};
