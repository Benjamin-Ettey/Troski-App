require("dotenv").config();

const express = require("express");
const connectDB = require("./src/config/databaseConfig");
const app = express();

const morgan = require("morgan");
const notFound = require("./src/middleware/notFound");
const errorHandlerMiddleware = require("./src/middleware/errorHandler");

const authRouter = require("./src/routes/authRouter");
const adminRouter = require("./src/routes/adminRouter");
const driverRouter = require("./src/routes/driverRouter");
const passengerRouter = require("./src/routes/passengerRouter");
const cookieParser = require("cookie-parser");
const {
  authenticateAdmin,
  authenticateDriver,
  authenticatePassenger,
} = require("./src/middleware/authMiddleware");

const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Middleware
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", authenticateAdmin, adminRouter);
app.use("/api/v1/driver", authenticateDriver, driverRouter);
app.use("/api/v1/passenger", authenticatePassenger, passengerRouter);
// // Test route
// app.get("/", (req, res) => {
//   res.send("API is running...");
// });

app.use(notFound);
app.use(errorHandlerMiddleware);

// Start server
const port = process.env.PORT || 5000;

// Connect to database
connectDB();

app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
