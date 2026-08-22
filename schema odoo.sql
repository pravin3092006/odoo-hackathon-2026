-- ============================================================
-- Dayflow HRMS — Supabase / PostgreSQL schema
-- Run this whole file in Supabase SQL Editor (Project > SQL Editor > New query)
-- Safe to re-run: drops existing Dayflow objects first.
-- ============================================================

-- ---------- CLEANUP (safe re-run) ----------
drop table if exists public.leave_requests cascade;
drop table if exists public.attendance cascade;
drop table if exists public.payroll cascade;
drop table if exists public.employees cascade;
drop type if exists public.app_role cascade;
drop type if exists public.attendance_status cascade;
drop type if exists public.leave_type cascade;
drop type if exists public.leave_status cascade;

-- ---------- ENUMS ----------
create type public.app_role as enum ('admin', 'employee');
create type public.attendance_status as enum ('present', 'absent', 'half_day', 'leave');
create type public.leave_type as enum ('paid', 'sick', 'unpaid');
create type public.leave_status as enum ('pending', 'approved', 'rejected');

-- ---------- EMPLOYEES (1:1 with auth.users) ----------
create table public.employees (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text unique not null,
  full_name text not null,
  email text unique not null,
  role public.app_role not null default 'employee',
  job_title text,
  department text,
  phone text,
  address text,
  profile_picture_url text,
  date_joined date default current_date,
  base_salary numeric(12,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_employees_role on public.employees(role);

-- ---------- ATTENDANCE ----------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status public.attendance_status not null default 'present',
  notes text,
  created_at timestamptz default now(),
  unique (employee_id, work_date)
);

create index idx_attendance_employee_date on public.attendance(employee_id, work_date);

-- ---------- LEAVE REQUESTS ----------
create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type public.leave_type not null,
  start_date date not null,
  end_date date not null,
  remarks text,
  status public.leave_status not null default 'pending',
  reviewer_id uuid references public.employees(id),
  reviewer_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (end_date >= start_date)
);

create index idx_leave_employee on public.leave_requests(employee_id);
create index idx_leave_status on public.leave_requests(status);

-- ---------- PAYROLL ----------
create table public.payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  pay_period text not null, -- e.g. '2026-08'
  basic_salary numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_salary numeric(12,2) generated always as (basic_salary + allowances - deductions) stored,
  status text default 'issued',
  created_at timestamptz default now(),
  unique (employee_id, pay_period)
);

create index idx_payroll_employee on public.payroll(employee_id);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

create trigger trg_leave_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

-- ---------- auto-create employee row on signup ----------
-- Reads role/full_name/employee_code from the signup form's user metadata.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.employees (id, employee_code, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'employee_code', 'EMP-' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'employee')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- helper: is current user an admin? ----------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.employees
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_requests enable row level security;
alter table public.payroll enable row level security;

-- EMPLOYEES policies
create policy "employees_select_own_or_admin"
  on public.employees for select
  using (id = auth.uid() or public.is_admin());

create policy "employees_update_own_limited_or_admin"
  on public.employees for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "employees_insert_admin_only"
  on public.employees for insert
  with check (public.is_admin());

create policy "employees_delete_admin_only"
  on public.employees for delete
  using (public.is_admin());

-- ATTENDANCE policies
create policy "attendance_select_own_or_admin"
  on public.attendance for select
  using (employee_id = auth.uid() or public.is_admin());

create policy "attendance_insert_own_or_admin"
  on public.attendance for insert
  with check (employee_id = auth.uid() or public.is_admin());

create policy "attendance_update_own_or_admin"
  on public.attendance for update
  using (employee_id = auth.uid() or public.is_admin())
  with check (employee_id = auth.uid() or public.is_admin());

create policy "attendance_delete_admin_only"
  on public.attendance for delete
  using (public.is_admin());

-- LEAVE REQUESTS policies
create policy "leave_select_own_or_admin"
  on public.leave_requests for select
  using (employee_id = auth.uid() or public.is_admin());

create policy "leave_insert_own"
  on public.leave_requests for insert
  with check (employee_id = auth.uid());

create policy "leave_update_own_pending_or_admin"
  on public.leave_requests for update
  using (
    (employee_id = auth.uid() and status = 'pending')
    or public.is_admin()
  )
  with check (
    (employee_id = auth.uid()) or public.is_admin()
  );

create policy "leave_delete_own_pending_or_admin"
  on public.leave_requests for delete
  using (
    (employee_id = auth.uid() and status = 'pending')
    or public.is_admin()
  );

-- PAYROLL policies (read-only for employees, full control for admin)
create policy "payroll_select_own_or_admin"
  on public.payroll for select
  using (employee_id = auth.uid() or public.is_admin());

create policy "payroll_insert_admin_only"
  on public.payroll for insert
  with check (public.is_admin());

create policy "payroll_update_admin_only"
  on public.payroll for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "payroll_delete_admin_only"
  on public.payroll for delete
  using (public.is_admin());

-- ============================================================
-- NOTES ON DEMO DATA
-- ============================================================
-- Demo employees/admin accounts must be created via Supabase Auth (Sign Up
-- screen or Auth > Users in the dashboard) because auth.users rows cannot be
-- inserted directly with a usable password via SQL. Once a user signs up,
-- the on_auth_user_created trigger above automatically creates their
-- `employees` row. To make a user an admin for demo purposes, run e.g.:
--
--   update public.employees set role = 'admin' where email = 'admin@dayflow.demo';
--
-- After you have at least one admin and a couple of employee accounts, you
-- can seed sample attendance/leave/payroll rows, e.g.:
--
--   insert into public.attendance (employee_id, work_date, status, check_in, check_out)
--   select id, current_date - 1, 'present', now() - interval '1 day 8 hours', now() - interval '1 day'
--   from public.employees where role = 'employee' limit 1;
