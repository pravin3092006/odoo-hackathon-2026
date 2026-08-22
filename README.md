# Nexora HR — Full Stack (Frontend + Supabase Backend)

This package contains:

```
nexora-hr/
├── frontend/     React + Vite HRMS app (UI you uploaded, now wired to Supabase)
└── backend/      Supabase schema, Edge Functions, and a demo-data seed script
```

## Quick start

1. **Backend first** → open `backend/README.md` and follow steps 1–4
   (create Supabase project → run `schema.sql` → seed demo data → deploy the
   two Edge Functions).
2. **Frontend** → open `frontend/README.md`, set `frontend/.env` from
   `frontend/.env.example` using your Supabase project URL + anon key, then:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Open http://localhost:5173 and sign in with a seeded demo account
   (e.g. `admin@nexora.hr` / `admin123`) or register a new one.

## What changed from the original mock-data version

- All 8 data domains (employees/profiles, payroll, attendance, leave
  requests, leave balances, notifications, pay slips, activity feed) now
  live in Postgres tables instead of an in-memory JS object.
- Login/Register/Change-password use real Supabase Auth instead of
  plaintext-password checks against a mock array.
- Row Level Security enforces that employees can only see/edit their own
  records, while admins can see and manage everyone's — enforced by the
  database itself, not just hidden in the UI.
- Admin "Add Employee" / "Delete Employee" call two Supabase Edge Functions
  so the privileged service-role key is never shipped to the browser.
- The frontend page components (`Dashboard.jsx`, `Employees.jsx`,
  `Attendance.jsx`, `Leave.jsx`, `Payroll.jsx`, `Profile.jsx`) were **not**
  modified — the context layer (`HRMSContext.jsx`) exposes the exact same
  `state` shape and `actions` API as before, now backed by Supabase queries
  instead of a local reducer.

## Deploying

- **Frontend**: any static host (Vercel, Netlify, Cloudflare Pages) — it's a
  Vite SPA. Set the two `VITE_SUPABASE_*` env vars in your host's dashboard.
- **Backend**: fully managed by Supabase — no server to deploy other than the
  two small Edge Functions (`supabase functions deploy ...`).
