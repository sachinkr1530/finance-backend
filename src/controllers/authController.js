const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * POST /api/auth/register
 * Public. Creates a new user (default role: viewer).
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Public. Returns a JWT on valid credentials.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const token = signToken(user._id);
    user.password = undefined; // strip before sending

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected. Returns the authenticated user's profile.
 */
const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
