require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Record = require("../models/Record");
const connectDB = require("../config/db");

const CATEGORIES = [
  "salary", "freelance", "investment", "rent", "utilities",
  "groceries", "transport", "healthcare", "entertainment", "education", "other",
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomAmount = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

async function seed() {
  await connectDB();
  console.log("Seeding database...");

  await User.deleteMany({});
  await Record.deleteMany({});

  // Create users for each role
  const [admin, analyst, viewer] = await User.create([
    { name: "Alice Admin", email: "admin@example.com", password: "password123", role: "admin" },
    { name: "Bob Analyst", email: "analyst@example.com", password: "password123", role: "analyst" },
    { name: "Carol Viewer", email: "viewer@example.com", password: "password123", role: "viewer" },
  ]);

  console.log("Users created.");

  // Create 60 records spread over the past 6 months
  const records = [];
  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const type = Math.random() > 0.4 ? "expense" : "income";
    const category =
      type === "income"
        ? randomItem(["salary", "freelance", "investment"])
        : randomItem(["rent", "utilities", "groceries", "transport", "healthcare", "entertainment", "education", "other"]);

    records.push({
      amount: type === "income" ? randomAmount(500, 5000) : randomAmount(50, 1500),
      type,
      category,
      date,
      notes: `Seed record #${i + 1}`,
      createdBy: admin._id,
    });
  }

  await Record.create(records);
  console.log("60 financial records created.");

  console.log("\n=== Seed complete ===");
  console.log("Login credentials:");
  console.log("  Admin:   admin@example.com   / password123");
  console.log("  Analyst: analyst@example.com / password123");
  console.log("  Viewer:  viewer@example.com  / password123");

  mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
