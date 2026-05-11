require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./src/config/databaseConfig");

const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const notFound = require("./src/middleware/notFound");
const errorHandlerMiddleware = require("./src/middleware/errorHandler");

const {
  authenticateUser,
  authorizePermissions,
} = require("./src/middleware/authMiddleware");

// Import the Socket Auth Middleware
const socketAuth = require("./src/middleware/socketAuth");

const authRouter = require("./src/routes/authRouter");
const adminRouter = require("./src/routes/adminRouter");
const userRouter = require("./src/routes/userRouter");
const rideRouter = require("./src/routes/rideRouter");
const walletRouter = require("./src/routes/walletRouter");

const initializeRideSocket = require("./src/socket/socketManager");

const cloudinary = require("cloudinary");

const app = express();
const server = http.createServer(app);

// ================================
// SOCKET.IO
// ================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 1. Attach Socket Middleware BEFORE initializing logic
// This ensures every connection is authenticated via JWT
io.use(socketAuth);

// 2. Make io globally accessible for controllers
app.set("io", io);

// 3. Initialize ride socket logic (now with authenticated sockets)
initializeRideSocket(io);

// ================================
// CLOUDINARY
// ================================

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ================================
// MIDDLEWARE
// ================================

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

// ================================
// ROUTES
// ================================

app.use("/api/v1/auth", authRouter);

app.use(
  "/api/v1/admin",
  authenticateUser,
  authorizePermissions("admin"),
  adminRouter,
);

app.use("/api/v1/user", userRouter);

// Note: If rideRouter handles location updates, ensure authenticateUser is inside it
app.use("/api/v1/ride", rideRouter);

app.use(
  "/api/v1/wallet",
  authenticateUser,
  authorizePermissions("passenger", "driver"),
  walletRouter,
);

// ================================
// ERROR HANDLERS
// ================================

app.use(notFound);
app.use(errorHandlerMiddleware);

// ================================
// SERVER & DATABASE
// ================================

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Server running on port ${port}...`);
    });
  } catch (error) {
    console.log("Database connection failed", error);
  }
};

start();
