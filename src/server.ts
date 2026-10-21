import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";
import { connectDB } from "./config/db.config";
import { startPayoutScheduler } from "./services/payment/payout.scheduler";
import { startDemandScheduler } from "./services/booking/demand.scheduler";
import { initRedis, closeRedis } from "./services/realtime/redis";
import { initSseBackplane } from "./services/realtime/sse";

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    // Optional Redis (no-op without REDIS_URL): SSE backplane + GEO for
    // multi-instance deployments.
    initRedis();
    initSseBackplane();

    // Schedulers live here (not app.ts) so they never run during tests that
    // import the app. Each is leader-locked, so it's safe to start on every
    // instance — only one instance actually runs a given job per tick.
    startPayoutScheduler();
    startDemandScheduler();

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}...`);
    });

    // Graceful shutdown: stop accepting connections, then close the DB.
    const shutdown = (signal: string) => {
      console.log(`${signal} received — shutting down...`);
      server.close(async () => {
        await closeRedis();
        await mongoose.connection.close();
        process.exit(0);
      });
      // Force-exit if cleanup hangs.
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.log("Failed to start server", error);
  }
};

start();
