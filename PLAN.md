# Expense Tracker — Development Plan

## 1. Application Name

**Expense Tracker** — a personal expense-tracking web application.

## 2. Problem Statement

Most people track spending in spreadsheets, notes, or their heads, which makes it hard to see where money actually goes. There is no single, private, always-available place to log an expense in seconds, categorize it, and see monthly totals and category breakdowns.

Expense Tracker solves this by giving every user a private account where they can:

- Log expenses quickly (amount, category, description, date).
- See a dashboard with "how much have I spent this month" and a category breakdown.
- Search and filter their full spending history.

The app is built for individual users, not teams: each user's data is fully private and isolated from every other user.

## 3. Target Users

- Up to **100 individual users** (single-user accounts, not shared/team accounts).
- People who want a simple, private way to track daily personal spending.
- Each user can only see and manage their **own** expenses and categories.

## 4. Main Features

### MVP (what gets built first)

1. **Authentication** — register, log in, log out, and "who am I" using email + password.
2. **Expense CRUD** — add, view, edit, and delete an expense (amount, category, description, date).
3. **Personal categories** — every user gets default categories (e.g. Food, Transport, Housing, Utilities, Entertainment, Health, Shopping, Other) and can add/rename/delete their own.
4. **Dashboard** — current-month total, spend-by-category breakdown, and a list of recent expenses.
5. **Expense list** — full history with search and filters (category and date range), plus pagination.
6. **Profile** — update display name and change password.

### Future enhancements (explicitly NOT in MVP)

- Monthly budgets per category with "over budget" alerts.
- Income tracking and net balance (income vs. expenses).
- Charts (pie / bar / line) for visual spending trends.
- CSV export of expenses.
- Recurring expenses (e.g. monthly subscriptions).
- Password reset via email link.
- Refresh tokens / longer-lived sessions (MVP uses a single short-lived JWT).
- Multi-currency support.
- Dark mode / more advanced theming.

## 5. Required Pages and Screens

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Register (Sign Up) | Create an account with name, email, password |
| 2 | Login | Sign in with email + password |
| 3 | Dashboard | Month total, category breakdown, recent expenses |
| 4 | Expenses | Searchable/filterable list + add/edit expense form |
| 5 | Categories | View, add, rename, delete personal categories |
| 6 | Profile / Settings | Update name, change password, log out |
| 7 | (Optional) Landing | Public intro page that links to Login/Register |
| 8 | Not Found / Error | Friendly 404 page with a link back home |

The add/edit expense form is implemented as a **modal on the Expenses page** (no separate route needed), keeping navigation simple.

## 6. Technology Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | JavaScript (ES modules) | Requirement; no TypeScript |
| Frontend | React 18 + Vite | Fast dev server, simple setup, modern |
| Styling | Plain CSS (CSS files / CSS modules) | Requirement |
| Backend | Node.js + Express | Lightweight REST API |
| Database | PostgreSQL | Relational, ACID, free tiers available |
| DB access | `pg` (node-postgres) with **parameterized SQL** | Simple, JS-native, prevents SQL injection |
| Validation | `zod` | Shared input-validation schemas on the server |
| Auth | JWT in an `httpOnly` cookie + `bcrypt` | Secure, no plaintext, token not readable by JS |
| Frontend API calls | `fetch` with `credentials: 'include'` | Sends the auth cookie automatically |
| Logging | `morgan` | Simple HTTP request logging; secrets are never logged |
| Testing | Vitest + React Testing Library (FE); Vitest + Supertest (BE) | One test runner across the whole repo |
| Version control | Git + GitHub | Requirement |
| Hosting | **Vercel** (frontend), **Render** (backend), **Render PostgreSQL** (database) | Free/cheap tiers, easy for 100 users |

### System architecture — how the pieces communicate

```
Browser (React + Vite, on Vercel)
        │  HTTPS  (JSON + httpOnly auth cookie)
        ▼
Express API (Node.js, on Render)
        │  pg driver, parameterized SQL over a connection pool
        ▼
PostgreSQL database (on Render)
```

1. The React app loads in the browser and makes `fetch` calls to the backend's REST API (e.g. `https://api.example.com/api/expenses`).
2. Every request (except register/login) carries the user's JWT in an `httpOnly` cookie, which the browser sends automatically because the frontend uses `credentials: 'include'` — this requires the two apps to be **same-site** (see Section 13).
3. The Express server verifies the JWT in middleware, then queries PostgreSQL through the `pg` connection pool.
4. Results are returned as JSON and rendered by React.

In **development**, the Vite dev server proxies `/api` requests to `http://localhost:3001` so the frontend and backend run as if they were one app (no CORS issues during local work).

## 7. Project Folder Structure

A single Git repository with two top-level folders (`client` and `server`). The `expense-tracker/` root below is the **existing project directory**, not a new nested folder.

```
expense-tracker/
├── client/                      # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI (ExpenseForm, ExpenseCard, Navbar, ProtectedRoute...)
│   │   ├── pages/               # Login, Register, Dashboard, Expenses, Categories, Profile, NotFound
│   │   ├── context/             # AuthContext (current user, login/logout state)
│   │   ├── services/            # api.js — fetch wrappers for all endpoints
│   │   ├── styles/              # Plain CSS files
│   │   ├── App.jsx              # Routing + route guards
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js           # Includes /api dev proxy
│   └── package.json
├── server/                      # Node + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js           # Reads/validates environment variables
│   │   │   └── db.js            # pg connection pool
│   │   ├── db/
│   │   │   ├── schema.sql       # CREATE TABLE statements
│   │   │   └── seed.sql         # Optional demo/test data (default categories are created at runtime on registration)
│   │   ├── middleware/
│   │   │   ├── auth.js          # Verifies JWT, attaches req.user
│   │   │   ├── validate.js      # zod validation middleware
│   │   │   └── errorHandler.js  # Central error handling
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── expense.routes.js
│   │   │   └── stats.routes.js
│   │   ├── controllers/         # Handler logic for each route
│   │   ├── app.js               # Express app setup (middleware, routes)
│   │   └── server.js            # Starts the server
│   ├── .env.example             # Documented env vars (no secrets committed)
│   └── package.json
├── .gitignore                   # node_modules, .env, dist, etc.
├── README.md                    # Setup + run instructions
└── PLAN.md                      # This document
```

## 8. Database Schema and Relationships

Three tables. All timestamps are `TIMESTAMPTZ`.

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Emails are lowercased before insert/update; this index makes uniqueness case-insensitive.
CREATE UNIQUE INDEX users_email_lower_idx ON users (LOWER(email));

CREATE TABLE categories (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)   -- one category name per user
);

CREATE TABLE expenses (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description  VARCHAR(255),
  expense_date DATE          NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_user_date     ON expenses (user_id, expense_date);
CREATE INDEX idx_expenses_user_category ON expenses (user_id, category_id);
```

### Relationships

- **users 1—N categories**: one user owns many categories. Deleting a user deletes their categories (`ON DELETE CASCADE`).
- **users 1—N expenses**: one user owns many expenses. Deleting a user deletes their expenses.
- **categories 1—N expenses**: an expense belongs to one category. If a category is deleted, its expenses keep their `category_id` set to `NULL` (uncategorized) instead of being deleted (`ON DELETE SET NULL`).

Every query is scoped by `user_id`, so a user can never read or modify another user's rows.

## 9. Data to Be Stored

| Data | Field(s) | Notes |
|------|----------|-------|
| User account | name, email, password hash | Never store the plaintext password — only the bcrypt hash; email is stored lowercased |
| Category | name (per user) | Seeded defaults on registration |
| Expense | amount, description, date, category | The core record the app tracks |
| Timestamps | created_at, updated_at | For sorting and audit |

**Intentionally not stored:** plaintext passwords, refresh tokens in the database (MVP uses a single short-lived JWT of about 1 hour), and any third-party personal data.

## 10. API Endpoints

All routes are under `/api`. Everything except `register` and `login` requires a valid JWT cookie.

### Auth

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/register` | Create account, return logged-in session | No |
| POST | `/api/auth/login` | Verify credentials, set auth cookie | No |
| POST | `/api/auth/logout` | Clear the auth cookie | Yes |
| GET  | `/api/auth/me` | Return current user (id, name, email) | Yes |
| PUT  | `/api/auth/me` | Update current user's display name | Yes |
| PUT  | `/api/auth/password` | Change password (requires current password) | Yes |

### Categories

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/categories` | List the current user's categories |
| POST   | `/api/categories` | Create a category |
| PUT    | `/api/categories/:id` | Rename a category |
| DELETE | `/api/categories/:id` | Delete a category (expenses become uncategorized) |

### Expenses

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/expenses` | List expenses with filters: `?category_id=&startDate=&endDate=&search=&page=&limit=` |
| POST   | `/api/expenses` | Create an expense |
| GET    | `/api/expenses/:id` | Get a single expense |
| PUT    | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |

### Stats / Dashboard

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/stats/summary` | Current-month total, spend-by-category, recent expenses |

Standard JSON response shape:

```json
{ "data": { ... } }              // success
{ "error": "message" }           // failure
```

## 11. Development Steps in Sequence

Build the backend and database first, then the frontend, then deploy.

1. **Initialize the repo** — use the existing project directory as the repo root (do not create a nested folder), `git init`, add `.gitignore` (ignore `node_modules`, `.env`, `dist`, build output), and an initial commit.
2. **Scaffold the backend** — `npm init` in `server/`, install `express`, `pg`, `bcrypt`, `jsonwebtoken`, `cookie-parser`, `cors`, `dotenv`, `helmet`, `express-rate-limit`, `zod`, `morgan`; add `nodemon` (or use Node's `--watch`) as a dev dependency.
3. **Set up the database** — create the PostgreSQL database, write `schema.sql`, and run it to create `users`, `categories`, `expenses`.
4. **Build the DB layer** — `config/db.js` (connection pool) and `config/env.js` (validated env vars).
5. **Build auth** — register, login, logout, `/me`; hash passwords with bcrypt; issue a short-lived JWT in an `httpOnly` cookie.
6. **Build auth middleware** — verify the JWT and attach `req.user` to every protected request.
7. **Build category routes** — CRUD scoped to `req.user.id`; seed default categories on registration.
8. **Build expense routes** — CRUD with filters and pagination; validate input with `zod` schemas (amount > 0, valid date, string lengths).
9. **Build stats route** — aggregate SQL for month total and category breakdown.
10. **Scaffold the frontend** — create the Vite React app in `client/`, add the `/api` dev proxy, install `react-router-dom`.
11. **Add auth to the frontend** — `AuthContext`, login/register pages, protected routes, and an API helper that sends cookies.
12. **Build the pages** — Dashboard, Expenses (list + add/edit modal), Categories, Profile, and a Not Found page.
13. **Test** — install test dependencies (Vitest, Supertest, React Testing Library), configure `TEST_DATABASE_URL`, apply `schema.sql` to the test database, then run backend API tests, frontend component tests, and manual end-to-end checks locally.
14. **Commit and push to GitHub** — push to `main`.
15. **Deploy** — database, backend, then frontend (see Section 14).
16. **Final verification** — run the acceptance checklist (Section 16) against the live app.

## 12. Testing Strategy

Testing stays practical for a beginner building for 100 users.

### Backend (Vitest + Supertest)
- **Auth**: register creates a user and hashes the password; login rejects wrong password; protected routes reject missing/invalid tokens.
- **Expenses**: CRUD returns correct results and **only the current user's data**; invalid input (negative amount, missing date) returns a 400.
- **Categories**: default categories are seeded on registration; deleting a category sets expenses to uncategorized.
- Use a **separate test database** (`TEST_DATABASE_URL`) so tests never touch real data.

### Frontend (Vitest + React Testing Library)
- Login/Register forms render and call the API correctly.
- The Dashboard renders summary values.
- Protected routes redirect unauthenticated users to Login.

### Manual E2E checklist (required for every release)
- Register a new account → land on Dashboard.
- Add an expense → it appears in the list and updates the month total.
- Filter by category and search by text.
- Log out → protected pages redirect to Login.
- Log in as a **second** user → confirm they see **none** of the first user's data.

## 13. Security Requirements

### Authentication & private data (how it stays secure)

- **Passwords** are hashed with **bcrypt** (cost factor 10+) before storing; the plaintext is never written anywhere and never logged.
- **Sessions** use a **JWT signed with a strong secret** (at least 64 random bytes, stored only in `JWT_SECRET`, rotated if ever exposed). The JWT is **short-lived (about 1 hour)** and delivered in an **`httpOnly` cookie**, so:
  - Browser JavaScript cannot read the token, which prevents token theft via XSS.
  - The cookie is marked `Secure` (HTTPS only in production) and `SameSite=Lax`.
  - A `SameSite=Lax` cookie is only sent on **same-site** requests, so in production the frontend and backend must share one registrable domain (e.g. `app.example.com` and `api.example.com`). If they must stay on different domains (default `*.vercel.app` vs `*.onrender.com`), set the cookie to `SameSite=None; Secure` instead.
- **Private data isolation** is enforced by the backend: every SQL query includes `WHERE user_id = $1` using the authenticated user's id from the verified JWT. The client can only ever request rows the server allows.
- **CSRF**: with a `SameSite=Lax` cookie plus a JSON API (no form-based state changes), cross-site request forgery risk is mitigated; this is the standard approach for this cookie-based architecture.

### Other requirements

- **Input validation** on every endpoint using `zod` schemas (type, length, amount > 0, valid date) — reject bad input with a 400.
- **Parameterized SQL queries only** (no string-built SQL) — prevents SQL injection.
- **Helmet** sets secure HTTP headers (CSP, HSTS, etc.).
- **CORS** locked to the exact frontend origin with `credentials: true`.
- **Rate limiting** on `register` and `login` (e.g. `express-rate-limit`) to slow brute-force attempts.
- **Logging** with `morgan` (method, path, status, duration) — never log passwords, tokens, or full financial payloads.
- **Environment variables** for all secrets (`DATABASE_URL`, `JWT_SECRET`); `.env` is git-ignored and only `.env.example` is committed.
- **No secrets in the frontend** — the React app holds no keys or tokens in code or localStorage.

## 14. Deployment Approach

### Hosting summary

| Piece | Provider | Notes |
|-------|----------|-------|
| Frontend | **Vercel** | Builds the Vite app, serves over HTTPS |
| Backend | **Render** (Web Service) | Runs the Express server |
| Database | **Render PostgreSQL** | Managed database with backups |

> **Free-tier caveats:** Render's free web services cold-start after being idle, and Render's free PostgreSQL expires after roughly 30 days. For a persistent 100-user app, use Render's paid tier or switch the database to Neon's free PostgreSQL tier.

### Step-by-step GitHub plan

1. Create a new **GitHub repository** (private is fine) — do not initialize it with a README.
2. Locally, `git init` (if not done), set the remote, and commit everything in logical commits:
   - `git remote add origin https://github.com/<you>/expense-tracker.git`
   - Commit 1: project scaffold + `.gitignore` + `README.md`
   - Commit 2: backend (db layer, auth, routes)
   - Commit 3: frontend (pages, auth context, API helper)
   - Commit 4: tests
3. Push to `main`: `git branch -M main && git push -u origin main`.
4. Use **feature branches** going forward (`git checkout -b feature/budgets`), open pull requests, and merge into `main` — each merge to `main` triggers a production deploy (see below).

### Step-by-step deployment plan

1. **Database first** — in Render, create a PostgreSQL instance, note the **internal** and **external** connection URLs, then apply the schema: `psql "$DATABASE_URL" -f src/db/schema.sql` (or an npm `db:setup` script). Apply future schema changes as migrations.
2. **Backend** — create a Render **Web Service** connected to the GitHub repo:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Add env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (the Vercel URL), `NODE_ENV=production`.
3. **Frontend** — in Vercel, import the repo:
   - Root directory: `client`
   - Framework: Vite, build command `npm run build`, output `dist`
   - Add env var `VITE_API_URL` = the Render backend URL.
4. **Custom domain + cookie/HTTPS** — put both apps on the same registrable domain (e.g. `app.example.com` and `api.example.com`) so the `SameSite=Lax` cookie is sent; ensure the backend serves over HTTPS, the cookie is `Secure`, and CORS allows the frontend origin. If using the default `*.vercel.app` / `*.onrender.com` domains, set the cookie to `SameSite=None; Secure`.
5. **Smoke test** the live app: register, log in, add an expense, verify data survives a page refresh.

## 15. Project Timeline

Suggested week-by-week schedule for a beginner (sequence matters more than exact dates).

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| Week 1 | Setup + backend scaffold | Repo, Express server, PostgreSQL schema created |
| Week 2 | Auth + database layer | Register/login/logout working with secure cookies |
| Week 3 | Expense & category APIs | Full CRUD + stats endpoint, tested |
| Week 4 | Frontend | Login, Register, Dashboard, Expenses, Categories, Profile |
| Week 5 | Testing + deployment | Tests pass; app live on Vercel + Render |
| Week 6 | Polish + buffer | Acceptance checklist, bug fixes, README |

## 16. Acceptance Criteria

The project is complete when all of the following are true:

1. A new user can register and is redirected to a dashboard.
2. A user can log in with correct credentials and is rejected with incorrect credentials.
3. A logged-in user can add, edit, and delete an expense with amount, category, description, and date.
4. The dashboard shows the current month's total spending, spend-by-category, and recent expenses.
5. The expense list supports search, category filter, and date-range filter.
6. Users can add, rename, and delete their own categories; default categories exist on signup.
7. Users can update their display name, change their password (requiring the current password), and log out.
8. A user can **never** see or modify another user's expenses or categories (verified with two test accounts).
9. Passwords are stored only as bcrypt hashes; no plaintext appears in logs, code, or the database.
10. The frontend, backend, and database communicate correctly in production over HTTPS (including the auth cookie).
11. The app is deployed: frontend on Vercel, backend and database on Render.
12. The source is in a GitHub repository with a clear `README.md` and `.gitignore`.
13. Automated backend tests pass, and the manual E2E checklist passes.
14. All the above works for the target of up to 100 concurrent users without errors.
