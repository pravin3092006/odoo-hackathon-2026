// Supabase Edge Function: admin-create-employee
// Lets a logged-in admin create a brand-new employee (auth account + profile
// + payroll row) without needing the service-role key in the browser.
//
// Deploy:  supabase functions deploy admin-create-employee
// Call from frontend: supabase.functions.invoke('admin-create-employee', { body: {...} })

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';

    // Client scoped to the caller's JWT — used only to verify who is calling.
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: CORS_HEADERS });
    }

    // Admin client (service role) — used to actually perform privileged actions.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: callerProfile } = await adminClient.from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can add employees' }), { status: 403, headers: CORS_HEADERS });
    }

    const body = await req.json();
    const { name, empId, email, role = 'employee', department, jobTitle, joiningDate, baseSalary } = body;

    if (!name || !empId || !email) {
      return new Response(JSON.stringify({ error: 'name, empId and email are required' }), { status: 400, headers: CORS_HEADERS });
    }

    const tempPassword = 'welcome123';
    const nameParts = String(name).trim().split(' ');
    const initials = nameParts.map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#7C3AED', '#0D9488', '#2563EB', '#D97706', '#DC2626', '#059669'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        emp_id: empId, role, name,
        avatar_initials: initials, avatar_color: avatarColor,
        first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '',
      },
    });
    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: CORS_HEADERS });
    }

    const newId = created.user.id;

    // The DB trigger already inserted default profile/payroll/leave_balance rows —
    // fill in the specifics the admin provided.
    await adminClient.from('profiles').update({
      job_title: jobTitle || '',
      department: department || '',
      joining_date: joiningDate || new Date().toISOString().split('T')[0],
    }).eq('id', newId);

    const sal = parseInt(baseSalary) || 60000;
    await adminClient.from('payroll').update({
      base_salary: sal,
      hra: Math.round(sal * 0.2),
      medical: 10000,
      transport: 5000,
      tax: Math.round(sal * 0.1),
      pf: Math.round(sal * 0.12),
      net_salary: Math.round(sal * 0.98),
      currency: 'USD',
    }).eq('user_id', newId);

    await adminClient.from('activity_feed').insert({
      type: 'employee_added', user_id: caller.id, message: `New employee ${name} added.`,
    });

    return new Response(JSON.stringify({ id: newId, tempPassword }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS_HEADERS });
  }
});
