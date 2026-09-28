import "dotenv/config";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cloudinary from "cloudinary";
import cookieParser from "cookie-parser";
import notFound from "./middleware/notFound";
import errorHandlerMiddleware from "./middleware/errorHandler.middleware";
import authRouter from "./routes/auth.routes";
import driverRouter from "./routes/driver.routes";
import adminRouter from "./routes/admin.routes";
import bookingRouter from "./routes/booking.routes";
import paymentRouter from "./routes/payment.routes";
import { handlePaystackWebhook } from "./controllers/payment.controller";
import { authenticateUser, authorizeRoles } from "./middleware/auth.middleware";
import { globalLimiter } from "./middleware/rateLimiter.middleware";

const app = express();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// The Paystack webhook must see the RAW request bytes to verify the signature,
// so it is mounted with a raw body parser BEFORE express.json() consumes it.
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "*/*" }),
  handlePaystackWebhook,
);

app.use(express.json());
app.use(helmet());
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));
app.set("trust proxy", 1);

app.use("/api", globalLimiter);

app.use("/api/v1/auth", authRouter);
app.use(
  "/api/v1/driver",
  authenticateUser,
  authorizeRoles("driver"),
  driverRouter,
);
app.use(
  "/api/v1/admin",
  authenticateUser,
  authorizeRoles("admin"),
  adminRouter,
);
app.use("/api/v1/bookings", authenticateUser, bookingRouter);
app.use("/api/v1/payments", authenticateUser, paymentRouter);

app.use(notFound);
app.use(errorHandlerMiddleware);

export default app;
