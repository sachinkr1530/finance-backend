const express = require("express");
const morgan = require("morgan");
const { globalErrorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const recordRoutes = require("./routes/recordRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Request logging in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json());

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler — must be last
app.use(globalErrorHandler);

module.exports = app;
