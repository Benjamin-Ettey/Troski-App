require("dotenv").config();

const express = require("express");
const connectDB = require("./src/config/databaseConfig");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});