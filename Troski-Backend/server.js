require("dotenv").config();

// ─── Fail fast on missing env ──────────────────────────────────────────
// Better to refuse to boot with a clear message than to start the server
// and 500 on the first request that needs a secret.
const REQUIRED_ENV = [
  "JWT_SECRET", // signs auth tokens
  "WALLET_HASH_SECRET", // HMAC on wallet balances; never change after launch
  "PAYSTACK_SECRET_KEY", // ride payments + driver withdrawals
  "MONGO_URI", // database
  "CLOUD_NAME", // Cloudinary uploads (ID docs, vehicle photos)
  "CLOUD_API_KEY",
  "CLOUD_API_SECRET",
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(
    `\n❌ Missing required environment variables: ${missingEnv.join(", ")}\n` +
      `   Set them in .env or your deployment config before starting the server.\n`,
  );
  process.exit(1);
}
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn(
    "⚠️  GOOGLE_MAPS_API_KEY not set — falling back to straight-line route matching (less accurate).",
  );
}

const http = require("http");
const express = require("express");
const connectDB = require("./src/config/databaseConfig");
const app = express();

const morgan = require("morgan");
const notFound = require("./src/middleware/notFound");
const errorHandlerMiddleware = require("./src/middleware/errorHandler");
const {
  handleUploadErrors,
} = require("./src/middleware/multerMiddleware");

const authRouter = require("./src/routes/authRouter");
const adminRouter = require("./src/routes/adminRouter");
const driverRouter = require("./src/routes/driverRouter");
const passengerRouter = require("./src/routes/passengerRouter");
const driverApplicationRouter = require("./src/routes/driverApplicationRouter");
const tripRouter = require("./src/routes/tripRouter");
const driverLocationRouter = require("./src/routes/driverLocationRouter");
const walletRouter = require("./src/routes/walletRouter");
const {
  handlePaystackWebhook,
} = require("./src/controllers/walletController");

const cookieParser = require("cookie-parser");
const {
  authenticateAdmin,
  authenticateDriver,
  authenticatePassenger,
} = require("./src/middleware/authMiddleware");

const cloudinary = require("cloudinary");
const setupSockets = require("./src/socket");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  // Default SDK timeout is 60s, which can fire on slower connections
  // for full-resolution phone photos. 120s gives slow links room.
  timeout: 120000,
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Paystack webhook needs the RAW body for HMAC signature validation.
// It MUST be mounted BEFORE the global express.json() parser.
app.post(
  "/api/v1/wallet/paystack/webhook",
  express.raw({ type: "application/json" }),
  handlePaystackWebhook,
);

// Middleware
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/driver-application", driverApplicationRouter);
app.use("/api/v1/trip", tripRouter);
app.use("/api/v1/driver-location", driverLocationRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/admin", authenticateAdmin, adminRouter);
app.use("/api/v1/driver", authenticateDriver, driverRouter);
app.use("/api/v1/passenger", authenticatePassenger, passengerRouter);

app.use(notFound);
// Catch multer errors (oversized files etc.) BEFORE the generic handler so
// users get a clean 413 with a "image too large" message.
app.use(handleUploadErrors);
app.use(errorHandlerMiddleware);

// HTTP server + socket.io
const server = http.createServer(app);
setupSockets(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || true,
    credentials: true,
  },
});

const port = process.env.PORT || 5000;

connectDB();

server.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
