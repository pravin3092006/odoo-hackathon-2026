// Supabase Edge Function: admin-delete-employee
// Lets a logged-in admin fully remove an employee (auth account + all rows,
// via ON DELETE CASCADE foreign keys) without exposing the service-role key.
//
// Deploy:  supabase functions deploy admin-delete-employee
// Call from frontend: supabase.functions.invoke('admin-delete-employee', { body: { userId } })

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: CORS_HEADERS });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: callerProfile } = await adminClient.from('profiles').select('role').eq('id', caller.id).single();
    if (callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can remove employees' }), { status: 403, headers: CORS_HEADERS });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400, headers: CORS_HEADERS });
    }
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: 'You cannot delete your own account' }), { status: 400, headers: CORS_HEADERS });
    }

    // Deleting the auth user cascades to profiles → payroll/attendance/leave/etc.
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS_HEADERS });
  }
});
