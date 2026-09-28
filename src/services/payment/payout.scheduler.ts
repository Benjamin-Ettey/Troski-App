import cron from "node-cron";
import { payoutService } from "./payout.service";

// Single-node scheduler. A leader-locked/distributed runner is a scale-time
// upgrade (same as the rest of the MVP).
let started = false;
let running = false;

/** Run a payout sweep, guarded so runs never overlap. */
export const runPayoutsGuarded = async (): Promise<void> => {
  if (running) return;
  running = true;
  try {
    const r = await payoutService.runScheduledPayouts();
    console.log(
      `[payouts] processed=${r.processed} paid=${r.paid} skipped=${r.skipped} failed=${r.failed}`,
    );
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
