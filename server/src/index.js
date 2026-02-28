const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const monitorsRouter = require("./routes/monitors");
const { startScheduler } = require("./scheduler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/monitors", monitorsRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

// Only start the server and scheduler if ran directly (not imported for tests)
if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");

      // Start background checks
      startScheduler();

      // Start listening for requests
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      process.exit(1); // Exit process if DB connection fails
    });
}

// Export the app for testing
module.exports = app;