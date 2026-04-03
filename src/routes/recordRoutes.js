const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/errorHandler");

const router = express.Router();

const VALID_TYPES = ["income", "expense"];
const VALID_CATEGORIES = [
  "salary", "freelance", "investment", "rent", "utilities",
  "groceries", "transport", "healthcare", "entertainment", "education", "other",
];

// All record routes require authentication
router.use(authenticate);

// Read: available to all authenticated roles
router.get(
  "/",
  [
    query("type").optional().isIn(VALID_TYPES).withMessage("Invalid type"),
    query("category").optional().isIn(VALID_CATEGORIES).withMessage("Invalid category"),
    query("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),
    query("endDate").optional().isISO8601().withMessage("endDate must be a valid date"),
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be 1–100"),
  ],
  handleValidationErrors,
  getRecords
);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid record ID")],
  handleValidationErrors,
  getRecordById
);

// Write: admin only
router.post(
  "/",
  authorize("admin"),
  [
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("type").isIn(VALID_TYPES).withMessage("Type must be income or expense"),
    body("category").isIn(VALID_CATEGORIES).withMessage("Invalid category"),
    body("date").optional().isISO8601().withMessage("Date must be a valid ISO date"),
    body("notes").optional().isLength({ max: 500 }).withMessage("Notes max 500 characters"),
  ],
  handleValidationErrors,
  createRecord
);

router.put(
  "/:id",
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid record ID"),
    body("amount").optional().isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("type").optional().isIn(VALID_TYPES).withMessage("Type must be income or expense"),
    body("category").optional().isIn(VALID_CATEGORIES).withMessage("Invalid category"),
    body("date").optional().isISO8601().withMessage("Date must be a valid ISO date"),
    body("notes").optional().isLength({ max: 500 }).withMessage("Notes max 500 characters"),
  ],
  handleValidationErrors,
  updateRecord
);

router.delete(
  "/:id",
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid record ID")],
  handleValidationErrors,
  deleteRecord
);

module.exports = router;
