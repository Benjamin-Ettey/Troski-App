import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db.config";
import { startPayoutScheduler } from "./services/payment/payout.scheduler";

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    // Start recurring driver payouts (scheduler lives here, not in app.ts, so it
    // never runs during tests that import the app).
    startPayoutScheduler();
    app.listen(port, () => {
      console.log(`Server running on port ${port}...`);
    });
  } catch (error) {
    console.log("Failed to start server", error);
  }
};

start();
