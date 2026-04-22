export const onRequestPost = async (context: any) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    const { email, name, role } = await context.request.json() as any;

    if (!email) {
      throw new Error('Email is required');
    }

    const SUPABASE_URL = context.env.SUPABASE_URL || context.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = context.env.SUPABASE_SERVICE_ROLE_KEY || context.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Call Supabase Admin Invite API using generic Fetch
    const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ email })
    });

    const inviteData = await inviteRes.json() as any;
    if (!inviteRes.ok) {
        throw new Error(inviteData.msg || inviteData.message || 'Error inviting user');
    }

    // Insert user into team_members table
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/team_members`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            id: inviteData.id,
            email: email,
            name: name,
            role: role || 'editor',
            created_at: new Date().toISOString()
        })
    });

    if (!dbRes.ok) {
        console.error("Failed to insert into team_members");
    }

    return new Response(JSON.stringify({ success: true, user: inviteData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestOptions = async () => {
    return new Response('ok', {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
    });
};
