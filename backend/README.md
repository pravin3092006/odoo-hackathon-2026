# Nexora HR — Supabase Backend

This folder turns Nexora HR from a mock/local-state demo into a real, persisted,
multi-user app backed by **Supabase** (Postgres + Auth + Row Level Security +
Edge Functions). No separate server to host — Supabase *is* the backend.

## What's here

```
backend/
├── supabase/
│   └── schema.sql              # All tables, RLS policies, triggers
├── functions/
│   ├── admin-create-employee/  # Edge Function: admin adds a new employee
│   └── admin-delete-employee/  # Edge Function: admin removes an employee
├── seed.js                     # One-time script to create demo accounts + sample data
├── package.json
└── .env.example
```

## 1. Create a Supabase project

1. Go to https://supabase.com/dashboard → **New Project**.
2. Wait for it to finish provisioning.
3. Open **Project Settings → API** and copy:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (keep this secret!)

## 2. Run the database schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   This creates all 8 tables, the `is_admin()` helper, the
   auto-create-profile trigger, and all Row Level Security policies.

## 3. Seed demo data (optional but recommended)

This creates the same demo accounts the original frontend documented
(`admin@nexora.hr` / `admin123`, `alex@nexora.hr` / `emp123`, etc.) plus
30 days of sample attendance and a few sample leave requests.

```bash
cd backend
npm install
cp .env.example .env
# edit .env and paste your SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm run seed
```

## 4. Deploy the Edge Functions (needed for "Add Employee" / "Delete Employee")

These two functions let an **admin** create or remove employee accounts
without ever exposing the service-role key to the browser.

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy admin-create-employee
supabase functions deploy admin-delete-employee
```

The functions automatically have access to `SUPABASE_URL`,
`SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as env vars — no extra
config needed on Supabase's side.

If you'd rather skip this step for now, the app still works — "Add Employee"
and "Delete Employee" in the Employees page will show an error toast until
the functions are deployed.

## 5. Connect the frontend

In `frontend/.env` (copy from `frontend/.env.example`):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is safe to ship in the frontend — all access control is
enforced by the RLS policies in `schema.sql`.

## Data model

| Table              | Purpose                                             |
| ------------------ | ---------------------------------------------------- |
| `profiles`          | One row per user (extends `auth.users`); name, role, department, etc. |
| `payroll`            | Salary structure per employee                        |
| `attendance`         | Daily clock-in/out records                            |
| `leave_requests`     | Leave applications + approval status                  |
| `leave_balance`      | Remaining paid/sick/unpaid days per employee           |
| `notifications`      | Per-user notification inbox                            |
| `pay_slip_history`   | Monthly pay slip records                                |
| `activity_feed`      | Shared activity stream (clock-in, leave actions, etc.)  |

## Security model

- **Row Level Security is on for every table.**
- Employees can only see/edit their own attendance, leave, payroll, and notifications.
- Admins (rows where `profiles.role = 'admin'`) can see and manage everyone's data,
  via the `is_admin()` SQL helper function.
- The `profiles` table (name/department/job-title directory) is readable by any
  signed-in user, which is what powers the Employee Directory page.
- Creating/deleting employee **accounts** requires the two Edge Functions above,
  since that needs the privileged service-role key — never exposed to the browser.

## Realtime (optional)

`schema.sql` adds `attendance`, `leave_requests`, `notifications`, and
`activity_feed` to the `supabase_realtime` publication, so if you want the
Admin/Employee views to update live without a page refresh, you can subscribe
with `supabase.channel(...)` in the frontend.
