const User = require("../models/User");

/**
 * GET /api/users
 * Admin only. Returns all users.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Admin only. Returns a single user.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/role
 * Admin only. Updates a user's role.
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Role updated", user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/status
 * Admin only. Activates or deactivates a user.
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot change your own status" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Status updated", user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Admin only. Permanently deletes a user.
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
};
