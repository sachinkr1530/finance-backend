const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verifies the JWT token from Authorization header.
 * Attaches the authenticated user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    if (user.status === "inactive") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Role-based access control guard.
 * Usage: authorize("admin") or authorize("admin", "analyst")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
