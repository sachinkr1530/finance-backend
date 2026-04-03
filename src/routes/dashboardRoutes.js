const express = require("express");
const { query } = require("express-validator");
const { getSummary, getTrends } = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/errorHandler");

const router = express.Router();

// Dashboard data is available to analysts and admins
router.use(authenticate, authorize("analyst", "admin"));

router.get(
  "/summary",
  [
    query("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),
    query("endDate").optional().isISO8601().withMessage("endDate must be a valid date"),
  ],
  handleValidationErrors,
  getSummary
);

router.get(
  "/trends",
  [
    query("months")
      .optional()
      .isInt({ min: 1, max: 24 })
      .withMessage("months must be between 1 and 24"),
  ],
  handleValidationErrors,
  getTrends
);

module.exports = router;
