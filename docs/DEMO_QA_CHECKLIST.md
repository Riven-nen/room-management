# LCUP Laboratory — Demo & QA Checklist

Use this for a client demo, a defense rehearsal, or a regression pass.
It is a procedure, not a script to execute.

**Local URLs**
- Frontend: http://localhost:4000
- Backend: http://localhost:3000
- Health: http://localhost:3000/api/health

**Start everything**

```bash
npm run dev
```

This starts the API (`3000`, `NODE_ENV=development`) and the frontend (`4000`).

---

## 0. Pre-flight

- [ ] `npm run dev` shows both `api` and `web` running.
- [ ] `http://localhost:4000/login` loads full-bleed (no white frame around the page).
- [ ] `http://localhost:3000/api/health` returns `{ "status": "ok" }`.
- [ ] Log out / open an incognito window before starting so the demo is clean.
- [ ] Browser console has no red errors beyond the expected initial `401 /api/auth/me` on the login screen.
- [ ] Optional demo data: `cd backend && npm run seed:demo` (adds 5 class entries + 4 calendar events to `2026-2027 1st Semester`, idempotent).
- [ ] Note the current data: 6 users, 4 labs, 13 reservations, 2 semesters.

**Seeded accounts** (unless you changed the passwords)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password123` |
| Faculty | `teacher@gmail.com` | `password123` |
| Faculty | `teacher2@gmail.com` | `password123` |
| Student | `student@example.com` | `password123` |
| Student | `student@gmail.com` | `password123` |
| Student | `johnlesteraquino@gmail.com` | `password123` |

There is no seeded MIS Staff account. Create one during Section 4.

---

## Already verified automatically (still re-check visually)

These passed in development during the restructure:

- 32/32 API checks: health, login, persistent sessions, schedule CRUD, class overlap, booking/class conflict, DB double-booking protection, CSV import + rollback, registration codes, user management, role denials, student data redaction.
- Browser route pass for admin, student, and faculty: all routes render without runtime errors; student/admin redirects work.
- `npm run lint` and `npm run build` pass.
- Login page is full-bleed with no white frame.
- Modal overlay covers the full viewport; instructor dropdown lists active faculty.

What still needs a human eye: visual polish, mobile layout, print formatting, CSV output in Excel, and the exact wording of error messages.

---

## 1. Startup and session

- [ ] Open `http://localhost:4000` while logged out → redirected to `/login`.
- [ ] The login page shows the LCUP logo, white card, gold top border, and navy background.
- [ ] Login as `admin@example.com` → lands on `/dashboard`.
- [ ] Refresh the page → still logged in.
- [ ] Optional: stop and restart the backend, then refresh → still logged in (sessions live in Postgres).
- [ ] Click **Log Out** → returns to `/login`.
- [ ] Try opening `/admin/users` while logged out → redirected to `/login`.

**Expected:** no CORS errors, no white page, no flash of the old layout.

---

## 2. Role-based access (can be checked quickly with each account)

| Page / action | Admin | Faculty | MIS Staff | Student |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | No (redirects to Class Schedule) |
| Class Schedule | Yes | Yes | Yes | Yes |
| University Calendar | Yes | Yes | Yes | Yes |
| Lab Schedule | Yes | Yes | Yes | Yes |
| Work Booking | Yes | Yes | No | No |
| Manage Bookings | Yes | Yes | No | No |
| Manage Schedules | Yes | No | No | No |
| Registration Codes | Yes | No | No | No |
| User Management | Yes | No | No | No |
| Lab Management | Yes | No | No | No |
| Analytics Reports | Yes | No | No | No |
| Settings | Yes | Yes | Yes | Yes |

- [ ] Log in as `student@example.com` → lands on `/class-schedule`; sidebar has no admin or booking items.
- [ ] Manually open `/admin/schedules` as the student → redirected to `/class-schedule`.
- [ ] Log in as `teacher@gmail.com` → `/dashboard`; sidebar has bookings but no admin items.
- [ ] Manually open `/admin/labs` as faculty → redirected to `/dashboard`.

---

## 3. Admin dashboard

- [ ] Counters show total bookings, active reservations, pending requests, facility issues.
- [ ] Bar chart and donut chart render.
- [ ] Live Facility Status shows available / in use / maintenance.
- [ ] Click **Export Report** → downloads `bookings-report.csv`.
- [ ] No fake/dead buttons remain.

---

## 4. Registration codes and user management

### Generate a code
- [ ] Go to **Registration Codes**.
- [ ] Generate a **Faculty** code with max uses `1` and expiry `1` day.
- [ ] The code is shown once (format `LCUP-FAC-XXXX-XXXX`); **Copy** works.
- [ ] The code appears in the list as `active`.

### Register with the code
- [ ] Open a new incognito window → `/register`.
- [ ] Select **Faculty**, enter the code, and register a test account (e.g. `qa.faculty@example.com`).
- [ ] Registration succeeds and lands on the dashboard.
- [ ] The code now shows `used` (or uses `1/1`).
- [ ] Try the same code again → rejected as used.
- [ ] Register a **Student** without a code → succeeds.
- [ ] Try a made-up code for Faculty → rejected.

### MIS Staff
- [ ] Generate an **MIS Staff** code and register `qa.mis@example.com`.
- [ ] Log in as MIS → dashboard + schedules + settings only; no bookings/admin.

### User Management
- [ ] Go to **User Management**.
- [ ] Search for the QA account and filter by role.
- [ ] Change its role (e.g. Faculty → MIS Staff) → succeeds; log in again to see the new role.
- [ ] Deactivate the account → login is blocked with a clear message.
- [ ] Reactivate → login works again.
- [ ] Click **Reset** → a temporary password is shown once; login with it succeeds.
- [ ] Try to deactivate your own admin account → blocked.
- [ ] Log in as a student and open `/admin/users` → redirected.

---

## 5. Schedules (admin)

### Semesters
- [ ] **Manage Schedules → Semesters**.
- [ ] Add a semester with school year, term, start/end dates, and active flag.
- [ ] Only one semester can be active at a time.
- [ ] Edit it and confirm changes persist.
- [ ] Delete a QA semester → its class entries are also removed.

### Class entries
- [ ] **Class Schedule** tab → **Add Class**.
- [ ] Semester, course, year level, section, room dropdown, subject code, subject, instructor dropdown, day, start/end time are present.
- [ ] Instructor dropdown lists the active teacher accounts (`Other Teacher`, `Teacher Account`) plus `Unassigned / TBA`.
- [ ] Save → the entry appears in **Class Schedule**.
- [ ] Edit the entry → changes appear.
- [ ] Try an end time before the start time → validation error.
- [ ] Try an overlapping class in the same room/day/time → rejected with a conflict message.
- [ ] Delete the entry → removed.

### CSV import
- [ ] Click **Import CSV**.
- [ ] Upload or paste a CSV with headers:
  `course, year_level, section, subject_code, subject, instructor, day, start_time, end_time, room`.
- [ ] Import succeeds and the rows appear.
- [ ] Import a row that conflicts with an existing class → entire import is rejected (no partial insert).
- [ ] Invalid room or invalid day → clear row-level error.

### University calendar
- [ ] **University Calendar** tab → **Add Event**.
- [ ] Add an all-day holiday and a timed event.
- [ ] Both appear in **University Calendar** with the correct type color.
- [ ] Click an event in the public calendar → details panel appears.
- [ ] Edit and delete the event.

---

## 6. Bookings and conflicts

### Create a booking as admin or faculty
- [ ] Log in as `teacher@gmail.com` → **Work Booking**.
- [ ] Add a booking for a free room/time.
- [ ] The booking appears in the calendar.
- [ ] Faculty cannot book on behalf of another user (API returns 403 if attempted).
- [ ] Students have no Work Booking page.

### Class conflict
- [ ] Create a class entry for a room/day/time (Section 5).
- [ ] Try booking that room on the same weekday/time inside the semester dates → rejected with a class-conflict message.
- [ ] Book the same room at a non-class time → succeeds.

### Double booking
- [ ] Create a booking in a room/time.
- [ ] Try a second overlapping booking in the same room → rejected as already reserved.
- [ ] The database also enforces this with an exclusion constraint.

### Maintenance
- [ ] Put a lab under maintenance (Section 7).
- [ ] Try booking it → rejected as under maintenance.

### Manage bookings
- [ ] As admin, see all bookings; approve/reject and confirm status changes.
- [ ] As faculty, only see bookings for labs you coordinate.
- [ ] Faculty cannot change bookings for labs they do not coordinate.
- [ ] Status changes create a notification for the booking owner.

---

## 7. Labs and analytics

### Lab management (admin)
- [ ] **Lab Management → Register New Lab**.
- [ ] Add a lab with a coordinator and PC count.
- [ ] The coordinator is saved and shown in the lab list.
- [ ] Computers are created automatically (open the lab detail).
- [ ] Edit the lab and change the coordinator.
- [ ] Toggle whole-room maintenance with reason/date; booking is blocked.
- [ ] Toggle an individual PC’s maintenance state.
- [ ] Delete a QA lab; deletion is blocked if reservations still reference it. Existing class entries keep their text room label but lose the room link.

### Analytics (admin)
- [ ] Open **Analytics Reports**.
- [ ] Metrics, peak-hours chart, and lab-usage bars render.
- [ ] **Export CSV** downloads `analytics-report.csv`.
- [ ] Students and faculty cannot open the page.

---

## 8. Student experience

- [ ] Log in as `student@example.com` → lands on **Class Schedule**.
- [ ] Semester, course, year level, and section dropdowns work.
- [ ] Search by subject, instructor, or room works.
- [ ] **Print** opens a clean print preview (sidebar/navbar/filters hidden).
- [ ] **University Calendar** shows holidays/exams and event details.
- [ ] **Lab Schedule** shows live lab status and the weekly timetable.
- [ ] Student booking data is redacted: bookings show `Reserved` instead of names/purposes.
- [ ] Student cannot access `/bookings`, `/admin/*`, or `/manage-bookings`.

---

## 9. Settings

- [ ] Open **Settings**.
- [ ] Layout shows the hero, profile card, password card, and account/security card.
- [ ] Labels and inputs are readable (not 8–9px).
- [ ] Update the full name → success message and the navbar name updates.
- [ ] Role and email are read-only.
- [ ] Change password with mismatched passwords → validation error.
- [ ] Change password with fewer than 8 characters → validation error.
- [ ] Change password successfully → old password fails, new password works.

---

## 10. Cross-cutting QA

- [ ] Full-screen LCUP loader appears on first boot.
- [ ] Data pages show skeletons while loading (Dashboard, Class Schedule, Manage Schedules, User Management).
- [ ] Expired/invalid session → redirected to login instead of a blank error page.
- [ ] Empty states are clear (no semesters, no schedule entries, no bookings).
- [ ] Print output hides navigation and buttons.
- [ ] CSV exports open correctly in Excel/Sheets.
- [ ] No console errors during normal navigation.
- [ ] Responsive check at ~390px:
  - [ ] Sidebar becomes a drawer.
  - [ ] Overlay dims the page.
  - [ ] Menu button opens the drawer.
  - [ ] Tables scroll horizontally inside their cards.
- [ ] Modal overlay covers the entire viewport (sidebar and navbar included).
- [ ] Clicking inside a modal does not close it; clicking the backdrop does.
- [ ] Escape closes a modal.
- [ ] Page scrolling is locked while a modal is open.

---

## 11. Negative / security checks

- [ ] Student API call to `/api/admin/users` → `403`.
- [ ] Student API call to create a schedule → `403`.
- [ ] Faculty API call to create a schedule → `403`.
- [ ] Student API call to update a booking status → `403`.
- [ ] Faculty cannot manage an uncoordinated lab’s booking.
- [ ] Deactivated account’s existing session is invalidated.
- [ ] Invalid role/date/time/room input returns `400`/`404`, not a crash.
- [ ] Booking overlap returns `409`.
- [ ] Class overlap returns `409`.
- [ ] CSV conflict rolls back the whole import.

---

## 12. Cleanup after QA

- [ ] Deactivate QA accounts in **User Management** (there is no delete-user action).
- [ ] Delete QA semesters in **Manage Schedules → Semesters** (this also deletes their class entries).
- [ ] Delete QA calendar events.
- [ ] Cancel/delete QA bookings.
- [ ] Revoke unused QA registration codes.
- [ ] Leave demo seed data only if you want it for the presentation.
- [ ] Log out.

---

## Suggested 10-minute demo order

1. **Admin login** → dashboard, counters, charts, CSV export.
2. **Class Schedule** → semester/course/section filters + search + print.
3. **University Calendar** → month view, event details, upcoming list.
4. **Manage Schedules** → add a class, show the instructor dropdown, import CSV, add a calendar event.
5. **Registration Codes** → generate a faculty code.
6. **User Management** → show roles, deactivate/reactivate, reset password.
7. **Faculty login** → book a lab, show the class-conflict rejection, then approve from Manage Bookings.
8. **Lab Management** → add a lab with a coordinator, show maintenance blocking.
9. **Analytics** → charts and CSV export.
10. **Student login** → default Class Schedule, calendar, lab schedule, no admin pages.
11. **Settings** → update profile and password.
12. **Logout** → protected URL redirects to login.

---

## Known limitations (do not promise these)

- No email verification or self-service “forgot password”.
- No user delete (use deactivate).
- No audit log.
- No recurring master-calendar events.
- No schedule CSV export (print is available).
- No automated browser/API test suite in CI yet; CI runs lint, build, and backend syntax checks.
- Demo seed data is optional and idempotent, but it is still sample data.
