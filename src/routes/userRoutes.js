const express = require("express");
const { body, param } = require("express-validator");
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/errorHandler");

const router = express.Router();

// All user management routes are admin-only
router.use(authenticate, authorize("admin"));

router.get("/", getAllUsers);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  handleValidationErrors,
  getUserById
);

router.patch(
  "/:id/role",
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("role")
      .isIn(["viewer", "analyst", "admin"])
      .withMessage("Role must be viewer, analyst, or admin"),
  ],
  handleValidationErrors,
  updateUserRole
);

router.patch(
  "/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("status")
      .isIn(["active", "inactive"])
      .withMessage("Status must be active or inactive"),
  ],
  handleValidationErrors,
  updateUserStatus
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user ID")],
  handleValidationErrors,
  deleteUser
);

module.exports = router;
