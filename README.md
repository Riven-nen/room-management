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

## Schedules and Role-Based Access

Roles: `student`, `faculty`, `admin`, `mis_staff`.

- All signed-in users can view the **Class Schedule** and **University Calendar**.
- Only `admin` can create, edit, or delete semesters, class schedule entries, master calendar events, and registration codes.
- `student` accounts register freely. `faculty`, `admin`, and `mis_staff` must enter a registration code generated from **Registration Codes**.
- Legacy `teacher` accounts are treated as `faculty` by the application.

### Database Migrations

Run from `backend/`:

```bash
node migrations/run.js 001_add_roles.sql
node migrations/run.js 002_schedules.sql
# Run only after the updated backend is deployed:
node migrations/run.js 003_convert_teacher_role.sql
```

Set `SESSION_SECRET` in production. Use `NODE_ENV=development` only for local development over plain http.

## Tech Stack
- Frontend: React.js, Vite, Recharts, React Big Calendar
- Backend: Node.js, Express.js, Express-Session
- Database: PostgreSQL (Hosted on Supabase)
- Deployment: Vercel (Frontend), Render (Backend)

## Local Development Setup

### 1. Database Setup (Supabase)

Ensure you have a PostgreSQL database running and execute the required schema (tables: users, rooms, reservations, computers, notifications).

### 2. Backend Setup

Navigate to the backend folder and install dependencies:

    cd backend
    npm install

Create a .env file in the backend folder with the following variables:

    DATABASE_URL=your_supabase_connection_string
    NODE_ENV=development

Run the backend server:

    node server.js

### 3. Frontend Setup

Navigate to the frontend folder and install dependencies:

    cd frontend
    npm install

Create a .env file in the frontend folder with the following variable:

    VITE_API_URL=http://localhost:3000

Run the frontend development server:

    npm run dev

## Deployment Notes
- Backend (Render): Requires NODE_ENV=production and DATABASE_URL (using the Supabase Transaction Pooler on port 6543). Session cookies are configured with sameSite: "none" and secure: true for cross-domain requests.
- Frontend (Vercel): Requires the VITE_API_URL environment variable pointing to the live Render backend URL.

---
*Completed as a freelance engagement.*
