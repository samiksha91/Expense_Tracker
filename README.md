# Expense Tracker

A personal expense-tracking web app for individual users (target ~100 users).

## Features

- Email/password registration and login (JWT in an `httpOnly` cookie)
- Add, edit, delete, and search expenses
- Personal categories (seeded with defaults)
- Dashboard with current-month total and category breakdown
- Category spending report
- Strict per-user data isolation

## Tech Stack

- Frontend: React 18 + Vite, plain CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: bcrypt password hashing + JWT cookie sessions

## Project Structure

- `client/` — React + Vite frontend
- `server/` — Express API + PostgreSQL data access

## Prerequisites

- Node.js 18+
- PostgreSQL (local or managed)

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL, TEST_DATABASE_URL, and JWT_SECRET
```

Create the databases (example with psql):

```sql
CREATE DATABASE expense_tracker;
CREATE DATABASE expense_tracker_test;
```

Apply migrations and start the API:

```bash
npm run migrate
npm run dev   # or: npm start
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env   # optional; defaults to the Vite dev proxy
npm run dev
```

Open http://localhost:5173.

## Environment Variables (`server/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `TEST_DATABASE_URL` | Test database connection string |
| `JWT_SECRET` | Signing secret for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `1h`) |
| `FRONTEND_URL` | Allowed CORS origin |
| `COOKIE_SECURE` | Set to `true` in production (HTTPS only) |

## Tests

```bash
cd server
npm test                 # pg-mem unit/API tests + PostgreSQL integration (when TEST_DATABASE_URL is set)
npm run test:integration # PostgreSQL integration tests only
```

## Build

```bash
cd client
npm run build            # outputs to client/dist
```

## Deployment

Not yet deployed. Intended target: Vercel (frontend) + Render (backend and PostgreSQL).
