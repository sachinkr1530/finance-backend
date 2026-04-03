const Record = require("../models/Record");

/**
 * GET /api/dashboard/summary
 * Returns total income, expenses, net balance, and category breakdowns.
 * Accessible by Analyst and Admin.
 */
const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const [totals, categoryBreakdown, recentActivity] = await Promise.all([
      // Total income and expenses
      Record.aggregate([
        { $match: { isDeleted: false, ...dateFilter } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Category-wise breakdown
      Record.aggregate([
        { $match: { isDeleted: false, ...dateFilter } },
        {
          $group: {
            _id: { type: "$type", category: "$category" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // 5 most recent records
      Record.find({ ...dateFilter })
        .populate("createdBy", "name")
        .sort({ date: -1 })
        .limit(5)
        .select("amount type category date notes"),
    ]);

    // Reshape totals into { income, expense, netBalance }
    const income = totals.find((t) => t._id === "income")?.total || 0;
    const expense = totals.find((t) => t._id === "expense")?.total || 0;
    const incomeCount = totals.find((t) => t._id === "income")?.count || 0;
    const expenseCount = totals.find((t) => t._id === "expense")?.count || 0;

    // Reshape category breakdown into a cleaner structure
    const categories = categoryBreakdown.reduce((acc, item) => {
      const { type, category } = item._id;
      if (!acc[type]) acc[type] = {};
      acc[type][category] = { total: item.total, count: item.count };
      return acc;
    }, {});

    res.json({
      summary: {
        totalIncome: income,
        totalExpenses: expense,
        netBalance: income - expense,
        incomeTransactions: incomeCount,
        expenseTransactions: expenseCount,
      },
      categoryBreakdown: categories,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/trends
 * Returns monthly income vs expense trend for the past N months.
 * Accessible by Analyst and Admin.
 */
const getTrends = async (req, res, next) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 6, 24);

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const trends = await Record.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Reshape into a month-keyed map for easy frontend consumption
    const monthMap = {};
    for (const entry of trends) {
      const key = `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expense: 0 };
      monthMap[key][entry._id.type] = entry.total;
    }

    res.json({ months: Object.values(monthMap) });
  } catch (err) {
    next(err);
  }
};

// Helper: build a date filter object from optional query params
const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return {};
  const filter = { date: {} };
  if (startDate) filter.date.$gte = new Date(startDate);
  if (endDate) filter.date.$lte = new Date(endDate);
  return filter;
};

module.exports = { getSummary, getTrends };
