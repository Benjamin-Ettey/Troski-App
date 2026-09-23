import "dotenv/config";
import express from "express";
const app = express();
import morgan from "morgan";
import helmet from "helmet";
import notFound from "./middleware/notFound";
import errorHandlerMiddleware from "./middleware/errorHandler.middleware";
import { connectDB } from "./config/db.config";
import cloudinary from "cloudinary";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import driverRouter from "./routes/driver.routes";
import adminRouter from "./routes/admin.routes";
import { authenticateUser, authorizeRoles } from "./middleware/auth.middleware";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(helmet());
app.use(cookieParser(process.env.JWT_SECRET));
app.set("trust proxy", 1);

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

app.use(notFound);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}...`);
    });
  } catch (error) {
    console.log("Failed to start server", error);
  }
};

start();
