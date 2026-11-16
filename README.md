# Room Management

## Schedules and role-based access

Roles: `student`, `faculty`, `admin`, `mis_staff`.

- All signed-in users can view the **Class Schedule** and **University Calendar**.
- Only `admin` can create, edit, or delete semesters, class schedule entries, master calendar events, and registration codes.
- `student` accounts register freely. `faculty`, `admin`, and `mis_staff` must enter a registration code generated from **Registration Codes**.
- Legacy `teacher` accounts are treated as `faculty` by the application.

### Database migrations

Run from `backend/`:

```bash
node migrations/run.js 001_add_roles.sql
node migrations/run.js 002_schedules.sql
# Run only after the updated backend is deployed:
node migrations/run.js 003_convert_teacher_role.sql
```

Set `SESSION_SECRET` in production. Use `NODE_ENV=development` only for local development over plain http.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
