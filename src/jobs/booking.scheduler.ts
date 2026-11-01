import cron from "node-cron";
import { expireStaleRequests } from "../services/booking/booking.service";
import { runSingleton } from "../services/scheduler/leaderLock";

const LOCK_TTL_MS = 60 * 1000; // 1 minute

let started = false;
let running = false;

export const startBookingScheduler = (): void => {
  if (started) return;
  const schedule = process.env.BOOKING_EXPIRY_CRON || "* * * * *"; // Run every minute

  if (!cron.validate(schedule)) {
    console.error(
      `[booking] invalid BOOKING_EXPIRY_CRON "${schedule}" — scheduler off`,
    );
    return;
  }

  cron.schedule(schedule, async () => {
    if (running) return;
    running = true;
    try {
      // Prevents multiple pods/instances from expiring bookings simultaneously
      await runSingleton("booking-stale-expiry", LOCK_TTL_MS, async () => {
        await expireStaleRequests();
      });
    } catch (err) {
      console.error("[booking] stale request expiry failed", err);
    } finally {
      running = false;
    }
  });

  started = true;
  console.log(`[booking] stale request expiry scheduler started (${schedule})`);
};
