/**
 * Nexora HR — Demo data seeder
 * ------------------------------------------------------------------
 * Creates the demo login accounts + sample attendance / leave / payroll
 * data described in the frontend README, using the Supabase ADMIN API.
 *
 * ⚠️  Uses the SERVICE ROLE key — run this ONLY from a trusted machine
 *     (never in the browser, never commit the key to git).
 *
 * Usage:
 *   1. cd backend
 *   2. npm install
 *   3. Create a .env file (see .env.example) with:
 *        SUPABASE_URL=https://xxxx.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   4. node seed.js
 * ------------------------------------------------------------------
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'HR', 'Finance', 'Marketing'];

const DEMO_USERS = [
  { email: 'admin@nexora.hr', password: 'admin123', role: 'admin', name: 'Priya Sharma', empId: 'EMP001', avatarInitials: 'PS', avatarColor: '#7C3AED',
    profile: { first_name: 'Priya', last_name: 'Sharma', job_title: 'HR Manager', department: 'HR', phone: '+91 98765 43210', address: '42 MG Road, Bangalore', employment_type: 'Full-time', work_location: 'Hybrid', bio: 'Experienced HR professional with 8+ years in talent management.' },
    payroll: { base_salary: 180000, hra: 36000, medical: 15000, transport: 8000, tax: 28000, pf: 21600, net_salary: 189400, currency: 'INR' } },
  { email: 'alex@nexora.hr', password: 'emp123', role: 'employee', name: 'Alex Johnson', empId: 'EMP002', avatarInitials: 'AJ', avatarColor: '#0D9488',
    profile: { first_name: 'Alex', last_name: 'Johnson', job_title: 'Senior Engineer', department: 'Engineering', phone: '+1 555 234 5678', address: '128 Oak Street, Austin, TX', employment_type: 'Full-time', work_location: 'Remote', bio: 'Full-stack developer with expertise in React and Node.js.' },
    payroll: { base_salary: 120000, hra: 24000, medical: 10000, transport: 6000, tax: 18000, pf: 14400, net_salary: 127600, currency: 'INR' } },
  { email: 'maya@nexora.hr', password: 'emp123', role: 'employee', name: 'Maya Patel', empId: 'EMP003', avatarInitials: 'MP', avatarColor: '#2563EB',
    profile: { first_name: 'Maya', last_name: 'Patel', job_title: 'UX Designer', department: 'Design', phone: '+91 99887 76655', address: '55 Linking Road, Mumbai', employment_type: 'Full-time', work_location: 'Office', bio: 'UI/UX designer passionate about crafting intuitive digital experiences.' },
    payroll: { base_salary: 95000, hra: 19000, medical: 10000, transport: 5000, tax: 12000, pf: 11400, net_salary: 105600, currency: 'INR' } },
  { email: 'carlos@nexora.hr', password: 'emp123', role: 'employee', name: 'Carlos Rivera', empId: 'EMP004', avatarInitials: 'CR', avatarColor: '#D97706',
    profile: { first_name: 'Carlos', last_name: 'Rivera', job_title: 'Product Manager', department: 'Product', phone: '+1 555 876 5432', address: '901 Sunset Blvd, LA', employment_type: 'Full-time', work_location: 'Hybrid', bio: 'Product Manager with strong background in agile methodologies.' },
    payroll: { base_salary: 140000, hra: 28000, medical: 12000, transport: 7000, tax: 22000, pf: 16800, net_salary: 148200, currency: 'INR' } },
  { email: 'sarah@nexora.hr', password: 'emp123', role: 'employee', name: 'Sarah Kim', empId: 'EMP005', avatarInitials: 'SK', avatarColor: '#DC2626',
    profile: { first_name: 'Sarah', last_name: 'Kim', job_title: 'Finance Analyst', department: 'Finance', phone: '+82 10 2345 6789', address: '34 Gangnam-gu, Seoul', employment_type: 'Full-time', work_location: 'Office', bio: 'CFA Level 2 candidate with expertise in financial modelling.' },
    payroll: { base_salary: 85000, hra: 17000, medical: 8000, transport: 4000, tax: 10000, pf: 10200, net_salary: 93800, currency: 'KRW' } },
  { email: 'james@nexora.hr', password: 'emp123', role: 'employee', name: 'James Wilson', empId: 'EMP006', avatarInitials: 'JW', avatarColor: '#059669',
    profile: { first_name: 'James', last_name: 'Wilson', job_title: 'Marketing Manager', department: 'Marketing', phone: '+44 7700 900123', address: '77 Baker Street, London', employment_type: 'Full-time', work_location: 'Hybrid', bio: 'Digital marketing expert focused on growth-driven campaigns.' },
    payroll: { base_salary: 110000, hra: 22000, medical: 10000, transport: 6000, tax: 16000, pf: 13200, net_salary: 118800, currency: 'GBP' } },
];

const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

async function main() {
  console.log('🌱 Seeding Nexora HR demo data...\n');
  const idByEmail = {};

  // 1. Create auth users + profiles (profile row auto-created by DB trigger)
  for (const u of DEMO_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        emp_id: u.empId, role: u.role, name: u.name,
        avatar_initials: u.avatarInitials, avatar_color: u.avatarColor,
        first_name: u.profile.first_name, last_name: u.profile.last_name,
      },
    });
    if (error) {
      if (error.message?.includes('already been registered')) {
        console.log(`↷ ${u.email} already exists, skipping creation.`);
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list.users.find(x => x.email === u.email);
        idByEmail[u.email] = existing?.id;
        continue;
      }
      console.error(`❌ Failed creating ${u.email}:`, error.message);
      continue;
    }
    idByEmail[u.email] = data.user.id;
    console.log(`✔ Created ${u.email} (${u.role})`);

    // Fill in the rest of the profile fields + payroll (trigger already inserted defaults)
    await supabase.from('profiles').update({
      ...u.profile,
      joining_date: fmt(addDays(new Date(), -Math.floor(Math.random() * 900))),
    }).eq('id', data.user.id);

    await supabase.from('payroll').update(u.payroll).eq('user_id', data.user.id);
  }

  const adminId = idByEmail['admin@nexora.hr'];

  // 2. Sample attendance — last 29 working days per user
  console.log('\n📅 Seeding attendance...');
  for (const u of DEMO_USERS) {
    const uid = idByEmail[u.email];
    if (!uid) continue;
    const rows = [];
    for (let i = 29; i >= 1; i--) {
      const date = addDays(new Date(), -i);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      const rand = Math.random();
      let status = 'Present', checkIn = null, checkOut = null, hours = 0;
      if (rand > 0.85) { status = 'Absent'; }
      else if (rand > 0.75) { status = 'Leave'; }
      else if (rand > 0.65) { status = 'Half-day'; checkIn = '09:00 AM'; checkOut = '01:30 PM'; hours = 4.5; }
      else {
        const inH = 8 + Math.floor(Math.random() * 2), inM = Math.floor(Math.random() * 60);
        const outH = 17 + Math.floor(Math.random() * 2), outM = Math.floor(Math.random() * 60);
        hours = Math.round(((outH - inH) + (outM - inM) / 60) * 100) / 100;
        checkIn = `${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')} AM`;
        checkOut = `${String(outH > 12 ? outH - 12 : outH).padStart(2, '0')}:${String(outM).padStart(2, '0')} PM`;
      }
      rows.push({ id: `att-${uid}-${fmt(date)}`, user_id: uid, date: fmt(date), status, check_in: checkIn, check_out: checkOut, hours });
    }
    if (rows.length) await supabase.from('attendance').upsert(rows, { onConflict: 'user_id,date' });
  }

  // 3. Sample leave requests
  console.log('🌴 Seeding leave requests...');
  const leaveSamples = [
    { email: 'alex@nexora.hr', type: 'Paid', s: 3, e: 5, remarks: 'Family vacation trip planned.', status: 'Pending' },
    { email: 'maya@nexora.hr', type: 'Sick', s: -5, e: -4, remarks: 'Fever and throat infection.', status: 'Approved' },
    { email: 'carlos@nexora.hr', type: 'Paid', s: -10, e: -8, remarks: 'Personal matter to attend.', status: 'Rejected' },
    { email: 'sarah@nexora.hr', type: 'Sick', s: 1, e: 2, remarks: 'Dental surgery scheduled.', status: 'Pending' },
    { email: 'james@nexora.hr', type: 'Unpaid', s: 7, e: 9, remarks: 'Extended holiday visit.', status: 'Pending' },
  ];
  for (const [i, l] of leaveSamples.entries()) {
    const uid = idByEmail[l.email];
    if (!uid) continue;
    await supabase.from('leave_requests').upsert({
      id: `LR${String(i + 1).padStart(3, '0')}`,
      user_id: uid,
      leave_type: l.type,
      start_date: fmt(addDays(new Date(), l.s)),
      end_date: fmt(addDays(new Date(), l.e)),
      days: 2,
      remarks: l.remarks,
      status: l.status,
      reviewed_by: l.status === 'Pending' ? null : adminId,
      review_comments: l.status === 'Approved' ? 'Approved.' : l.status === 'Rejected' ? 'Please reschedule.' : '',
    }, { onConflict: 'id' });
  }

  console.log('\n✅ Done! Demo accounts (password shown for convenience):');
  DEMO_USERS.forEach(u => console.log(`   ${u.role.padEnd(9)} ${u.email}  /  ${u.password}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
