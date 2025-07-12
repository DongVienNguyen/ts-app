import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm kiểm tra quyền admin
async function isUserAdmin(supabaseClient: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabaseClient.rpc('is_admin');
  if (error) {
    console.error('Admin check error:', error);
    return false;
  }
  return data === true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Tạo client với quyền của người dùng gọi hàm
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Xác thực người dùng là admin
    const isAdmin = await isUserAdmin(supabaseUserClient);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { username, status } = await req.json();
    if (!username || !status || !['active', 'locked'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Parameters `username` and `status` are required.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Lấy thông tin người dùng đang thực hiện hành động
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    // Tạo client với service_role để thực hiện thay đổi
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const updateData = {
      account_status: status,
      locked_at: status === 'locked' ? new Date().toISOString() : null,
    };

    const { error: updateError } = await supabaseAdmin
      .from('staff')
      .update(updateData)
      .eq('username', username);

    if (updateError) throw updateError;

    // Ghi lại sự kiện bảo mật
    const eventType = status === 'locked' ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED';
    await supabaseAdmin.from('security_events').insert({
      event_type: eventType,
      username: username,
      event_data: { managed_by: user?.email || 'unknown_admin' },
      ip_address: req.headers.get('x-forwarded-for')
    });

    return new Response(JSON.stringify({ message: `User ${username} status successfully set to ${status}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})