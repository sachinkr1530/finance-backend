# Finance Dashboard Backend

A RESTful backend API for a finance dashboard system built with **Node.js**, **Express**, and **MongoDB**. Supports role-based access control, financial record management, and aggregated dashboard analytics.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Seeding Demo Data](#seeding-demo-data)
- [Role Model & Access Control](#role-model--access-control)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Records](#records)
  - [Dashboard](#dashboard)
- [Error Handling](#error-handling)
- [Assumptions & Design Decisions](#assumptions--design-decisions)

---

## Tech Stack

| Layer        | Choice                          |
|--------------|---------------------------------|
| Runtime      | Node.js                         |
| Framework    | Express 4                       |
| Database     | MongoDB (via Mongoose)          |
| Auth         | JWT (jsonwebtoken + bcryptjs)   |
| Validation   | express-validator               |
| Dev tooling  | nodemon, morgan                 |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, me
│   │   ├── userController.js      # User management (admin)
│   │   ├── recordController.js    # Financial records CRUD
│   │   └── dashboardController.js # Aggregated analytics
│   ├── middleware/
│   │   ├── auth.js                # JWT verify + role guard
│   │   └── errorHandler.js        # Validation + global error handler
│   ├── models/
│   │   ├── User.js                # User schema
│   │   └── Record.js              # Financial record schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── seed.js                # Demo data seeder
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Node.js v18+
- MongoDB running locally on port 27017, or a MongoDB Atlas URI

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd finance-backend

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET

# 4. (Optional) Seed demo data
npm run seed

# 5. Start the server
npm run dev      # development with auto-reload
npm start        # production
```

---

## Environment Variables

| Variable        | Description                              | Example                              |
|-----------------|------------------------------------------|--------------------------------------|
| `PORT`          | Port the server listens on               | `5000`                               |
| `MONGO_URI`     | MongoDB connection string                | `mongodb://localhost:27017/finance`  |
| `JWT_SECRET`    | Secret used to sign JWTs                 | `change_this_to_a_long_random_string`|
| `JWT_EXPIRES_IN`| Token lifespan                           | `7d`                                 |
| `NODE_ENV`      | Environment (`development`/`production`) | `development`                        |

---

## Running the Server

```bash
npm run dev    # starts with nodemon on PORT (default 5000)
```

Health check:
```
GET http://localhost:5000/health
→ { "status": "ok" }
```

---

## Seeding Demo Data

```bash
npm run seed
```

This creates 3 users and 60 randomized financial records spanning 6 months.

| Role    | Email                   | Password      |
|---------|-------------------------|---------------|
| Admin   | admin@example.com       | password123   |
| Analyst | analyst@example.com     | password123   |
| Viewer  | viewer@example.com      | password123   |

---

## Role Model & Access Control

Three roles are supported, each with different permissions:

| Action                          | Viewer | Analyst | Admin |
|---------------------------------|--------|---------|-------|
| Login / view own profile        | ✅     | ✅      | ✅    |
| View financial records          | ✅     | ✅      | ✅    |
| Create / update / delete records| ❌     | ❌      | ✅    |
| View dashboard summary & trends | ❌     | ✅      | ✅    |
| Manage users (role, status)     | ❌     | ❌      | ✅    |

Access control is enforced via two middleware functions in `src/middleware/auth.js`:

- **`authenticate`** — verifies the JWT and attaches `req.user`
- **`authorize(...roles)`** — checks that `req.user.role` is in the allowed list

---

## API Reference

All protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth

#### Register
```
POST /api/auth/register
```
**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```
**Response `201`:**
```json
{
  "token": "<jwt>",
  "user": { "_id": "...", "name": "Jane Doe", "email": "...", "role": "viewer" }
}
```
> New users always start as `viewer`. An admin can promote them.

---

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { ... }
}
```

---

#### Get Current User
```
GET /api/auth/me
```
🔒 Requires authentication.

**Response `200`:**
```json
{ "user": { "_id": "...", "name": "...", "role": "admin", "status": "active" } }
```

---

### Users

All endpoints in this group require `role: admin`.

#### List All Users
```
GET /api/users
```

#### Get User by ID
```
GET /api/users/:id
```

#### Update User Role
```
PATCH /api/users/:id/role
```
**Body:**
```json
{ "role": "analyst" }
```

#### Update User Status
```
PATCH /api/users/:id/status
```
**Body:**
```json
{ "status": "inactive" }
```

#### Delete User
```
DELETE /api/users/:id
```

---

### Records

#### List Records
```
GET /api/records
```
🔒 All authenticated roles.

**Query parameters (all optional):**

| Param       | Type   | Example              |
|-------------|--------|----------------------|
| `type`      | string | `income` or `expense`|
| `category`  | string | `salary`, `rent`, …  |
| `startDate` | ISO date | `2024-01-01`       |
| `endDate`   | ISO date | `2024-12-31`       |
| `page`      | int    | `1`                  |
| `limit`     | int    | `20` (max 100)       |

**Response `200`:**
```json
{
  "total": 48,
  "page": 1,
  "totalPages": 3,
  "records": [ ... ]
}
```

---

#### Get Record by ID
```
GET /api/records/:id
```
🔒 All authenticated roles.

---

#### Create Record
```
POST /api/records
```
🔒 Admin only.

**Body:**
```json
{
  "amount": 2500.00,
  "type": "income",
  "category": "salary",
  "date": "2024-06-01",
  "notes": "June salary"
}
```

**Valid categories:** `salary`, `freelance`, `investment`, `rent`, `utilities`, `groceries`, `transport`, `healthcare`, `entertainment`, `education`, `other`

---

#### Update Record
```
PUT /api/records/:id
```
🔒 Admin only. All fields optional.

---

#### Delete Record
```
DELETE /api/records/:id
```
🔒 Admin only. Performs a **soft delete** (`isDeleted: true`). The record is excluded from all subsequent queries automatically via a Mongoose pre-query hook.

---

### Dashboard

Both endpoints require `role: analyst` or `role: admin`.

#### Summary
```
GET /api/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31
```

**Response `200`:**
```json
{
  "summary": {
    "totalIncome": 18400.00,
    "totalExpenses": 9750.50,
    "netBalance": 8649.50,
    "incomeTransactions": 14,
    "expenseTransactions": 32
  },
  "categoryBreakdown": {
    "income": {
      "salary": { "total": 15000, "count": 6 },
      "freelance": { "total": 3400, "count": 8 }
    },
    "expense": {
      "rent": { "total": 4800, "count": 6 },
      "groceries": { "total": 1200.50, "count": 12 }
    }
  },
  "recentActivity": [ ... ]
}
```

---

#### Monthly Trends
```
GET /api/dashboard/trends?months=6
```

**Response `200`:**
```json
{
  "months": [
    { "month": "2024-01", "income": 3200, "expense": 1850 },
    { "month": "2024-02", "income": 2800, "expense": 2100 },
    ...
  ]
}
```

---

## Error Handling

All errors follow a consistent JSON shape:

```json
{ "message": "Human-readable description" }
```

Validation failures return `422` with field-level details:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than 0" }
  ]
}
```

| Scenario                    | Status |
|-----------------------------|--------|
| Missing / invalid token     | 401    |
| Insufficient role           | 403    |
| Resource not found          | 404    |
| Duplicate email             | 409    |
| Validation failure          | 422    |
| Unexpected server error     | 500    |

---

## Assumptions & Design Decisions

**Soft deletes for records** — Financial data should never be permanently destroyed. Deleted records are flagged with `isDeleted: true` and excluded automatically via a Mongoose pre-query hook, keeping an audit trail intact.

**Viewers can read records** — The assignment lists viewers as able to "view dashboard data". I interpreted this as access to the raw record list but not the aggregated analytics, which are reserved for analyst and admin roles.

**Pagination built in** — The `GET /api/records` endpoint supports `page` and `limit` query params to keep response sizes predictable.

**Password never returned** — The User schema uses `select: false` on the password field and a `toJSON` method that strips it, so it can never leak through any list or populate query.

**Admins cannot self-destruct** — Deleting or deactivating your own account via the API is blocked to prevent accidental lockout.

**Single-collection architecture** — All records live in one `records` collection with a `type` field (`income`/`expense`) rather than separate collections. This simplifies aggregation queries for dashboard analytics.

**Token blacklisting not implemented** — Logout is client-side (discard the token). For a production system, a Redis-backed token blocklist or short-lived tokens with refresh tokens would be appropriate.
