# LCUP Laboratory Management System

**Status:** Delivered / Freelance Project
**Client:** La Consolacion University Philippines (LCUP)

## Project Overview
A full-stack web application designed to streamline the scheduling, maintenance tracking, and analytics for university computer laboratories. The system was built to address specific administrative requirements, including role-based access, coordinator approval workflows, and real-time facility monitoring.

## Key Features
- Role-Based Access Control (RBAC): Distinct interfaces for Students, Faculty, MIS Staff, and Admins.
- Coordinator Approval Workflow: Admins can assign Coordinators to specific labs; Coordinators approve or reject booking requests.
- Comprehensive Booking System: Prevents double-booking, restricts past dates, and captures purpose, participants, and time.
- Maintenance Tracking: Toggle whole-room maintenance or track individual PC issues with reasons and expected return dates.
- Live Analytics: Real-time dashboards showing peak usage hours, most-used labs, and overall booking trends.
- Notification System: In-app alerts for new requests and approval status changes.
- Semester Class Schedule: Admin-published, searchable by course, section, year level, subject, instructor, and room.
- University Master Calendar: Admin-managed holidays, exams, enrollment periods, and university events.
- Registration Codes: Hashed, expiring, revocable codes protect Faculty, Admin, and MIS Staff sign-ups.
- User Management: Admins can change roles, deactivate accounts, and issue temporary passwords.
- Bulk Schedule Import: Paste or upload CSV to publish class schedules quickly.

## Schedules and Role-Based Access

Roles: `student`, `faculty`, `admin`, `mis_staff`.

- All signed-in users can view the **Class Schedule** and **University Calendar**.
- Only `admin` can create, edit, or delete semesters, class schedule entries, master calendar events, registration codes, and user accounts.
- `student` accounts register freely. `faculty`, `admin`, and `mis_staff` must enter a registration code generated from **Registration Codes**.
- Legacy `teacher` accounts are treated as `faculty` by the application.

### Shared Permissions

Page and capability access lives in `shared/permissions.json`. Both the React router and the Express middleware read the same file so the UI and API cannot drift apart.

### Database Migrations

Run from `backend/`:

```bash
node migrations/run.js 001_add_roles.sql
node migrations/run.js 002_schedules.sql
node migrations/run.js 003_convert_teacher_role.sql
node migrations/run.js 004_hardening.sql
```

`004_hardening.sql` adds the persistent `session` table, consistent id types, reservation overlap protection, room references for schedules, and missing indexes.

### Demo Data

From `backend/`:

```bash
npm run seed:demo
```

This creates a `2026-2027 1st Semester`, sample class entries using existing laboratories, and university calendar events. It is idempotent.

## Architecture

- **Frontend:** React 19 + Vite + React Router. Routes are lazy-loaded per page.
- **API:** Express 5 with same-origin `/api` calls.
- **Sessions:** `express-session` backed by the Postgres `session` table, so logins survive backend restarts.
- **Database:** PostgreSQL on Supabase. Reservations use a GiST exclusion constraint to prevent double-booking at the database level.
- **Deployment:** Vercel rewrites `/api/*` to the Render backend, making cookies first-party and removing the old cross-site cookie dependency.

## Tech Stack
- Frontend: React.js, Vite, Recharts, React Big Calendar, React Router
- Backend: Node.js, Express.js, Express-Session, Zod, Helmet, express-rate-limit
- Database: PostgreSQL (Hosted on Supabase)
- Deployment: Vercel (Frontend), Render (Backend)

## Local Development Setup

### 1. Database Setup (Supabase)

Ensure you have a PostgreSQL database running and apply the migrations in `backend/migrations/`.

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Set `DATABASE_URL` in `backend/.env`, then run:

```bash
npm start
```

Use `NODE_ENV=development` locally so the session cookie works over plain HTTP.

### 3. Frontend Setup

From the project root:

```bash
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:3000`, so no `VITE_API_URL` is needed. The dev server defaults to port 5173; use `npm run dev -- --port 4000` if another project is already using 5173.

## Deployment Notes

- **Backend (Render):** Set `DATABASE_URL`, `SESSION_SECRET`, and `NODE_ENV=production`. The server refuses to start in production without `SESSION_SECRET`.
- **Frontend (Vercel):** `vercel.json` rewrites `/api/*` to `https://room-management-475x.onrender.com/api/*`. If the Render URL changes, update `vercel.json`.
- **Cookies:** Same-origin through the Vercel rewrite, `sameSite: "lax"` and `secure: true` in production.
- **CORS:** Optional `ALLOWED_ORIGINS` can list exact origins for direct API access. The same-origin rewrite does not depend on CORS.
- **Health check:** `GET /api/health`.

## CI

`.github/workflows/ci.yml` installs both packages, runs ESLint, builds the frontend, and syntax-checks the backend.

---

*Completed as a freelance engagement.*
