require("dotenv").config();

const http = require("http");
const express = require("express");

const connectDB = require("./src/config/databaseConfig");

const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const notFound = require("./src/middleware/notFound");
const errorHandlerMiddleware = require("./src/middleware/errorHandler");

const authRouter = require("./src/routes/authRouter");
const driverApplicationRouter = require("./src/routes/driverApplicationRouter");
const tripRouter = require("./src/routes/tripRouter");
const driverLocationRouter = require("./src/routes/driverLocationRouter");

const cloudinary = require("cloudinary");
const setupSockets = require("./src/socket");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const app = express();
const server = http.createServer(app);

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
app.use("/api/v1/driver-application", driverApplicationRouter);
app.use("/api/v1/trip", tripRouter);
app.use("/api/v1/driver-location", driverLocationRouter);

app.use(notFound);
app.use(errorHandlerMiddleware);

// ================================
// SOCKET.IO
// ================================
setupSockets(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || true,
    credentials: true,
  },
});

// ================================
// START
// ================================
const port = process.env.PORT || 5000;

connectDB();

server.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
