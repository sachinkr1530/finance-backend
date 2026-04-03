const { validationResult } = require("express-validator");

/**
 * Reads express-validator errors and returns a 422 if any exist.
 * Place this after validation chains in a route.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * Global error handler. Catches anything passed via next(err).
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `${field} already exists` });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ message: messages.join(", ") });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
};

module.exports = { handleValidationErrors, globalErrorHandler };
