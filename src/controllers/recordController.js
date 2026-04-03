const Record = require("../models/Record");

/**
 * GET /api/records
 * Viewer, Analyst, Admin. Supports filtering by type, category, and date range.
 */
const getRecords = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Record.find(filter)
        .populate("createdBy", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Record.countDocuments(filter),
    ]);

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      records,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/records/:id
 * Viewer, Analyst, Admin.
 */
const getRecordById = async (req, res, next) => {
  try {
    const record = await Record.findById(req.params.id).populate("createdBy", "name email");
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ record });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/records
 * Admin only.
 */
const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = await Record.create({
      amount,
      type,
      category,
      date,
      notes,
      createdBy: req.user._id,
    });
    res.status(201).json({ message: "Record created", record });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/records/:id
 * Admin only. Full update of a record.
 */
const updateRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = await Record.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record updated", record });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/records/:id
 * Admin only. Soft delete.
 */
const deleteRecord = async (req, res, next) => {
  try {
    const record = await Record.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
