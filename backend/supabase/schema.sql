-- ============================================================================
-- Nexora HR — Supabase Backend Schema
-- Run this entire file once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. PROFILES  (extends auth.users — one row per employee/admin)
-- ============================================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  emp_id            text unique not null,
  email             text unique not null,
  role              text not null default 'employee' check (role in ('admin','employee')),
  name              text not null,
  avatar_initials   text,
  avatar_color      text default '#7C3AED',
  first_name        text,
  last_name         text,
  phone             text default '',
  address           text default '',
  job_title         text default '',
  department        text default '',
  joining_date      date default current_date,
  manager_id        uuid references public.profiles(id) on delete set null,
  employment_type   text default 'Full-time',
  work_location     text default 'Office',
  bio               text default '',
  emergency_contact text default '',
  date_of_birth     date,
  gender            text,
  nationality       text,
  created_at        timestamptz not null default now()
);

-- ============================================================================
-- 2. PAYROLL  (one row per employee)
-- ============================================================================
create table if not exists public.payroll (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  base_salary numeric not null default 0,
  hra         numeric not null default 0,
  medical     numeric not null default 0,
  transport   numeric not null default 0,
  tax         numeric not null default 0,
  pf          numeric not null default 0,
  net_salary  numeric not null default 0,
  currency    text not null default 'USD',
  pay_period  text not null default 'Monthly',
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- 3. ATTENDANCE  (one row per employee per day)
-- ============================================================================
create table if not exists public.attendance (
  id            text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  date          date not null,
  status        text not null default 'Present' check (status in ('Present','Absent','Leave','Half-day')),
  check_in      text,
  check_out     text,
  hours         numeric default 0,
  check_in_ts   bigint,
  check_out_ts  bigint,
  created_at    timestamptz not null default now(),
  unique (user_id, date)
);

-- ============================================================================
-- 4. LEAVE REQUESTS
-- ============================================================================
create table if not exists public.leave_requests (
  id               text primary key,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  leave_type       text not null check (leave_type in ('Paid','Sick','Unpaid')),
  start_date       date not null,
  end_date         date not null,
  days             int not null default 1,
  remarks          text default '',
  status           text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  reviewed_by      uuid references public.profiles(id) on delete set null,
  review_comments  text default '',
  created_at       timestamptz not null default now()
);

-- ============================================================================
-- 5. LEAVE BALANCE  (one row per employee)
-- ============================================================================
create table if not exists public.leave_balance (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  paid_total   int not null default 20,
  paid_used    int not null default 0,
  sick_total   int not null default 10,
  sick_used    int not null default 0,
  unpaid_total int not null default 5,
  unpaid_used  int not null default 0
);

-- ============================================================================
-- 6. NOTIFICATIONS
-- ============================================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null default 'info' check (type in ('info','success','error','warning')),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. PAY SLIP HISTORY
-- ============================================================================
create table if not exists public.pay_slip_history (
  id       text primary key,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  period   text not null,
  paid_on  date,
  status   text not null default 'Processing' check (status in ('Processing','Paid'))
);

-- ============================================================================
-- 8. ACTIVITY FEED
-- ============================================================================
create table if not exists public.activity_feed (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  user_id    uuid references public.profiles(id) on delete cascade,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- HELPER FUNCTION: is_admin()  (security definer avoids RLS recursion)
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- TRIGGER: auto-create a profile row whenever a new auth user signs up
-- Reads default fields from raw_user_meta_data (passed at signUp time).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, emp_id, email, role, name, avatar_initials, avatar_color, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'emp_id', 'EMP' || substr(new.id::text, 1, 6)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_initials', upper(left(new.email, 2))),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#7C3AED'),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (id) do nothing;

  insert into public.payroll (user_id) values (new.id) on conflict do nothing;
  insert into public.leave_balance (user_id) values (new.id) on conflict do nothing;
  insert into public.pay_slip_history (id, user_id, period, paid_on, status)
  values (
    'ps-' || new.id || '-' || to_char(now(), 'Mon'),
    new.id,
    to_char(now(), 'Month YYYY'),
    (date_trunc('month', now()) + interval '1 month - 1 day')::date,
    'Processing'
  ) on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.payroll           enable row level security;
alter table public.attendance        enable row level security;
alter table public.leave_requests    enable row level security;
alter table public.leave_balance     enable row level security;
alter table public.notifications     enable row level security;
alter table public.pay_slip_history  enable row level security;
alter table public.activity_feed     enable row level security;

-- PROFILES: everyone signed in can view the directory; users edit their own row;
-- admins can edit/delete any row.
create policy "profiles_select_all" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- PAYROLL: own row or admin can view; only admin can edit.
create policy "payroll_select" on public.payroll
  for select using (auth.uid() = user_id or public.is_admin());
create policy "payroll_upsert_admin" on public.payroll
  for insert with check (public.is_admin());
create policy "payroll_update_admin" on public.payroll
  for update using (public.is_admin());

-- ATTENDANCE: own row or admin can view; users clock themselves in/out, admin can too.
create policy "attendance_select" on public.attendance
  for select using (auth.uid() = user_id or public.is_admin());
create policy "attendance_insert" on public.attendance
  for insert with check (auth.uid() = user_id or public.is_admin());
create policy "attendance_update" on public.attendance
  for update using (auth.uid() = user_id or public.is_admin());

-- LEAVE REQUESTS: own requests or admin can view; users create their own;
-- only admin can approve/reject (update).
create policy "leave_select" on public.leave_requests
  for select using (auth.uid() = user_id or public.is_admin());
create policy "leave_insert" on public.leave_requests
  for insert with check (auth.uid() = user_id);
create policy "leave_update_admin" on public.leave_requests
  for update using (public.is_admin());

-- LEAVE BALANCE: own row or admin can view; admin manages updates.
create policy "leave_balance_select" on public.leave_balance
  for select using (auth.uid() = user_id or public.is_admin());
create policy "leave_balance_update_admin" on public.leave_balance
  for update using (public.is_admin());

-- NOTIFICATIONS: users see/update only their own; any signed-in user can create
-- a notification for someone else (e.g. employee notifying HR of a new leave request).
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_insert_any" on public.notifications
  for insert with check (auth.role() = 'authenticated');
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- PAY SLIP HISTORY: own rows or admin.
create policy "payslip_select" on public.pay_slip_history
  for select using (auth.uid() = user_id or public.is_admin());
create policy "payslip_insert_admin" on public.pay_slip_history
  for insert with check (public.is_admin());

-- ACTIVITY FEED: visible to all signed-in users (shared HR activity stream).
create policy "activity_select_all" on public.activity_feed
  for select using (auth.role() = 'authenticated');
create policy "activity_insert_any" on public.activity_feed
  for insert with check (auth.role() = 'authenticated');

-- ============================================================================
-- REALTIME (optional but recommended so Admin/Employee views stay in sync)
-- ============================================================================
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.leave_requests;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activity_feed;
