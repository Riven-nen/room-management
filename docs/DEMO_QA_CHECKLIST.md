# LabEase - Demo & QA Checklist

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
- [ ] Optional demo data: `cd backend && npm run seed:demo` (adds demo class entries and calendar events only when missing; idempotent).
- [ ] Sample CSV for import testing: `docs/sample-class-schedule.csv`.
- [ ] Note the current data before testing: users, labs, reservations, semesters, and class entries. Counts change as you test.
- [ ] Know the semester ranges:
  - `2026-2027 · 1st Semester`: Aug 3 – Nov 27, 2026 (active; class blocks appear here)
  - `2026-2027 · 2nd Semester`: Jan 5 – Apr 21, 2027 (inactive; no class entries yet)
- [ ] Class blocks only appear inside semester start/end dates. A week after the semester is intentionally empty.

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
- 13/13 MIS API checks and 14/14 MIS route/sidebar checks: MIS can manage schedules, labs, bookings, and analytics; blocked from Registration Codes and User Management.
- 9/9 class-cancellation checks: class blocks appear; another faculty gets 403; the assigned instructor cancels one date; the block disappears; the room becomes bookable; the date restores.
- 7/7 booking UI checks: class blocks appear; class details open; cancel action is visible; cancellation notice appears; block disappears; class-conflict message is visible inside the form.
- Lab Schedule Viewer shows class blocks in the weekly timetable and includes classes in the live lab status.
- Browser route pass for admin, student, and faculty: all routes render without runtime errors; student/admin redirects work.
- `npm run lint` and `npm run build` pass.
- Login page is full-bleed with no white frame; the sidebar/tab branding is LabEase.
- Modal overlay covers the full viewport; instructor dropdown lists active faculty.

What still needs a human eye: visual polish, mobile layout, print formatting, CSV output in Excel, and the exact wording of error messages.

---

## 1. Startup and session

- [ ] Open `http://localhost:4000` while logged out → redirected to `/login`.
- [ ] The login page shows the LabEase title, LCUP logo, white card, gold top border, and navy background.
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
| Lab Reservation | Yes | Yes | Yes | No |
| Manage Bookings | Yes | Yes | Yes | No |
| Manage Schedules | Yes | No | Yes | No |
| Registration Codes | Yes | No | No | No |
| User Management | Yes | No | No | No |
| Lab Management | Yes | No | Yes | No |
| Analytics Reports | Yes | No | Yes | No |
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
- [ ] There is no **Export Report** button on the Dashboard.
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

### MIS Staff (room/lab operations)
- [ ] Generate an **MIS Staff** code and register `mis.staff@example.com`.
- [ ] Log in as MIS → dashboard, schedules, labs, bookings, and analytics; no Registration Codes or User Management.
- [ ] MIS can open **Manage Schedules**, **Lab Management**, **Analytics Reports**, and **Manage Bookings**.
- [ ] MIS is redirected away from `/admin/registration-codes` and `/admin/users`.

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
- [ ] Instructor dropdown lists active faculty accounts plus `Unassigned / TBA`.
- [ ] Imported/entered instructor names are linked to the matching faculty account (so that instructor can cancel their class dates).
- [ ] Save → the entry appears in **Class Schedule**.
- [ ] Edit the entry → changes appear.
- [ ] Try an end time before the start time → validation error.
- [ ] Try an overlapping class in the same room/day/time → rejected with a conflict message.
- [ ] Book the same instructor in a different room at the same day/time → rejected (`already teaching`).
- [ ] Book the same course/year/section in a different room at the same day/time → rejected (`already has`).
- [ ] Try a room under maintenance → rejected (`under maintenance`).
- [ ] Create a future reservation, then add a class over it → rejected (`already has a reservation`).
- [ ] Use a semester with no start/end dates → rejected with a clear message.
- [ ] Delete the entry → removed.

### CSV import
- [ ] Click **Import CSV**.
- [ ] Upload or paste a CSV with headers:
  `course, year_level, section, subject_code, subject, instructor, day, start_time, end_time, room`.
- [ ] Use `docs/sample-class-schedule.csv` if you need a ready-made example.
- [ ] Import succeeds and the rows appear.
- [ ] Re-importing the same file → rejected as a conflict (all-or-nothing).
- [ ] Import a row that conflicts with an existing class → entire import is rejected (no partial insert).
- [ ] Import a row with an instructor, section, maintenance, or reservation conflict → entire import is rejected.
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
- [ ] Log in as `teacher@gmail.com` → **Lab Reservation**.
- [ ] Add a booking for a free room/time.
- [ ] The booking appears in the calendar.
- [ ] Faculty cannot book on behalf of another user (API returns 403 if attempted).
- [ ] Students have no Lab Reservation page.

### Class blocks and class-date cancellation
- [ ] The booking calendar shows class blocks for all semesters with schedules (navy with a gold border).
- [ ] The legend includes **Class Schedule**.
- [ ] Click a class block → **Scheduled Class** details appear (subject, course/section, semester, instructor, room, date, time).
- [ ] The assigned instructor sees **Cancel This Class Date**; another faculty does not.
- [ ] Cancel a class date → confirmation appears, the block disappears, and the room becomes bookable for that date.
- [ ] Restore the class date if you are testing (API/DB), or leave it canceled intentionally.
- [ ] Navigate to a week after the 1st Semester ends (after Nov 27, 2026) → no class blocks, and the hint explains why.

### Class conflict
- [ ] Create a class entry for a room/day/time (Section 5).
- [ ] Try booking that room on the same weekday/time inside the semester dates → rejected, and the class-conflict message appears **inside the Add Lab Reservation form**.
- [ ] Book the same room at a non-class time → succeeds.
- [ ] Try booking a canceled class date → succeeds (the class block is gone).

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
- [ ] Approving/rejecting updates the Dashboard counters and other open booking tabs without a manual refresh.

### Live refresh
- [ ] Open **Class Schedule** and **Lab Reservation** in two tabs.
- [ ] Add a class in **Manage Schedules** → Class Schedule and the booking calendar update without a reload.
- [ ] Cancel a class date in **Lab Reservation** → the class block disappears in the other tab.
- [ ] Add or cancel a booking → **Lab Schedule Viewer** and **Dashboard** reflect it without a reload.
- [ ] If the other tab is in a different browser or device, refresh manually (live refresh is per browser).

---

## 7. Labs and analytics

### Lab management (admin/MIS)
- [ ] **Lab Management → Register New Lab**.
- [ ] Add a lab with a coordinator and PC count.
- [ ] The coordinator is saved and shown in the lab list.
- [ ] Computers are created automatically (open the lab detail).
- [ ] Edit the lab and change the coordinator.
- [ ] Toggle whole-room maintenance with reason/date; booking is blocked.
- [ ] Toggle an individual PC’s maintenance state.
- [ ] Delete a QA lab; deletion is blocked if reservations still reference it. Existing class entries keep their text room label but lose the room link.

### Analytics (admin/MIS)
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
- [ ] The weekly timetable includes semester class blocks (navy/gold) alongside reservations.
- [ ] The live status shows **Currently In Use** for an active class or **Next Booking / Class** with the instructor name.
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

- [ ] Full-screen LabEase loader appears on first boot.
- [ ] Data pages show skeletons while loading (Dashboard, Class Schedule, Manage Schedules, User Management).
- [ ] Expired/invalid session → redirected to login instead of a blank error page.
- [ ] Empty states are clear (no semesters, no schedule entries, no bookings).
- [ ] Print output hides navigation and buttons.
- [ ] CSV exports open correctly in Excel/Sheets.
- [ ] Booking calendar shows class blocks and reservations together.
- [ ] Class cancellation confirmation and class-conflict errors are visible without opening the browser console.
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
- [ ] A different faculty cannot cancel another instructor’s class date → `403`.
- [ ] MIS can create schedules/labs/bookings but gets `403` for user management and registration codes.
- [ ] Deactivated account’s existing session is invalidated.
- [ ] Invalid role/date/time/room input returns `400`/`404`, not a crash.
- [ ] Canceling a non-class weekday → `400`.
- [ ] Booking overlap returns `409`.
- [ ] Class overlap returns `409`.
- [ ] CSV conflict rolls back the whole import.

---

## 12. Cleanup after QA

- [ ] Deactivate QA accounts in **User Management** (there is no delete-user action).
- [ ] Delete QA semesters in **Manage Schedules → Semesters** (this also deletes their class entries).
- [ ] Delete QA calendar events.
- [ ] Cancel/delete QA bookings.
- [ ] Restore any class dates canceled during testing, unless you want to leave them canceled.
- [ ] If you imported the sample CSV only for QA, delete those class entries or leave them for the demo.
- [ ] Revoke unused QA registration codes.
- [ ] Leave demo seed data only if you want it for the presentation.
- [ ] Log out.

---

## Suggested 10-minute demo order

1. **Admin login** → dashboard, counters, charts.
2. **Class Schedule** → semester/course/section filters + search + print.
3. **University Calendar** → month view, event details, upcoming list.
4. **Manage Schedules** → add a class, show the instructor dropdown, import CSV, add a calendar event.
5. **Registration Codes** → generate a faculty code.
6. **User Management** → show roles, deactivate/reactivate, reset password.
7. **MIS login** → operational pages; confirm Registration Codes and User Management are absent.
8. **Faculty login → Lab Reservation** → show class blocks, cancel one class date, book the freed slot, and show the class-conflict message inside the form.
9. **Manage Bookings** → approve/reject the faculty booking and show the notification.
10. **Lab Management** → add a lab with a coordinator, show maintenance blocking.
11. **Analytics** → charts and CSV export.
12. **Lab Schedule Viewer** → weekly timetable shows class blocks and live status includes classes.
13. **Student login** → default Class Schedule, calendar, lab schedule, no admin pages.
14. **Settings** → update profile and password.
15. **Logout** → protected URL redirects to login.

---

## Known limitations (do not promise these)

- No email verification or self-service “forgot password”.
- No user delete (use deactivate).
- No audit log.
- No recurring master-calendar events.
- No schedule CSV export (print is available).
- Class blocks only appear within each semester’s start/end dates; weeks after the semester are intentionally empty.
- Class blocks are read-only and are not reservations.
- Class-date cancellations have no undo button in the UI yet (the API supports restoring a date).
- The booking calendar loads all class occurrences for semesters with schedules; a very large schedule may make the first load heavier.
- No automated browser/API test suite in CI yet; CI runs lint, build, and backend syntax checks.
- Demo seed data is optional and idempotent, but it is still sample data.

---

## Merge & push gate

Only merge after the checklist above is clean.

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Backend syntax checks pass (CI runs these too).
- [ ] Migration `005_class_cancellations.sql` is applied on the target database.
- [ ] `git status` shows only intended files.
- [ ] Commit the QA/feature changes.
- [ ] Merge into `master` (or `main`) and push.
- [ ] On Render: set `SESSION_SECRET` and `NODE_ENV=production`.
- [ ] Confirm `vercel.json` still points at the correct Render backend URL.
- [ ] Production smoke test: login, open Class Schedule, open Lab Reservation with class blocks, make a booking, and cancel one class date.
