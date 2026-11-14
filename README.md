# LCUP Laboratory Management System

**Status:** Delivered / Freelance Project
**Client:** La Consolacion University Philippines (LCUP)

## Project Overview
A full-stack web application designed to streamline the scheduling, maintenance tracking, and analytics for university computer laboratories. The system was built to address specific administrative requirements, including role-based access, coordinator approval workflows, and real-time facility monitoring.

## Key Features
- Role-Based Access Control (RBAC): Distinct interfaces for Students, Teachers, and Admins.
- Coordinator Approval Workflow: Admins can assign Coordinators to specific labs; Coordinators approve or reject booking requests.
- Comprehensive Booking System: Prevents double-booking, restricts past dates, and captures purpose, participants, and time.
- Maintenance Tracking: Toggle whole-room maintenance or track individual PC issues with reasons and expected return dates.
- Live Analytics: Real-time dashboards showing peak usage hours, most-used labs, and overall booking trends.
- Notification System: In-app alerts for new requests and approval status changes.

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
