import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to create a crypto key from the JWT secret
async function createCryptoKey(secret: string): Promise<CryptoKey> {
  const secretBuffer = new TextEncoder().encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    secretBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Tên đăng nhập và mật khẩu là bắt buộc' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let { data: staff, error: fetchError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .ilike('username', username.toLowerCase().trim())
      .maybeSingle();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return new Response(JSON.stringify({ success: false, error: 'Lỗi hệ thống khi tìm người dùng' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!staff) {
      console.log('Login attempt for non-existent user:', username);
      return new Response(JSON.stringify({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (staff.last_failed_login) {
      const lastAttemptDate = new Date(staff.last_failed_login);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (lastAttemptDate < twentyFourHoursAgo) {
        const { data: updatedStaff, error: resetError } = await supabaseAdmin
          .from('staff')
          .update({ failed_login_attempts: 0 })
          .eq('id', staff.id)
          .select()
          .single();
        
        if (resetError) console.error('Error resetting failed login attempts due to time:', resetError);
        if (updatedStaff) staff = updatedStaff;
      }
    }

    if (staff.account_status === 'locked') {
      console.log('Locked account login attempt:', username);
      return new Response(JSON.stringify({ success: false, error: 'Tài khoản của bạn đã bị khóa. Hãy liên hệ Admin để được mở khóa.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);

    if (!isPasswordValid) {
      const newAttempts = (staff.failed_login_attempts || 0) + 1;
      let updateError = null;
      let errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';

      if (newAttempts >= 3) {
        const { error } = await supabaseAdmin
          .from('staff')
          .update({ account_status: 'locked', failed_login_attempts: newAttempts, last_failed_login: new Date().toISOString(), locked_at: new Date().toISOString() })
          .eq('id', staff.id);
        updateError = error;
        errorMessage = 'Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần. Hãy liên hệ Admin để được mở khóa.';
      } else {
        const { error } = await supabaseAdmin
          .from('staff')
          .update({ failed_login_attempts: newAttempts, last_failed_login: new Date().toISOString() })
          .eq('id', staff.id);
        updateError = error;
        errorMessage = `Mật khẩu không đúng. Còn ${3 - newAttempts} lần thử...`;
      }

      if (updateError) console.error('Error updating failed login attempts:', updateError);

      return new Response(JSON.stringify({ success: false, error: errorMessage }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { error: resetError } = await supabaseAdmin
      .from('staff')
      .update({ failed_login_attempts: 0, last_failed_login: null, locked_at: null, account_status: 'active' })
      .eq('id', staff.id);

    if (resetError) console.error('Error resetting failed login attempts:', resetError);

    const sanitizedUser = {
      id: staff.id,
      username: staff.username,
      staff_name: staff.staff_name,
      role: staff.role,
      department: staff.department,
      account_status: staff.account_status,
    };

    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error('JWT_SECRET is not set in environment variables.');
      return new Response(JSON.stringify({ success: false, error: 'Lỗi cấu hình máy chủ: JWT secret bị thiếu.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const key = await createCryptoKey(jwtSecret);
    
    const payload = {
      username: staff.username,
      role: staff.role,
      department: staff.department,
      iss: 'asset-management-app',
      sub: staff.id,
      exp: getNumericDate(24 * 60 * 60), // Expires in 24 hours
    };

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    return new Response(JSON.stringify({ success: true, user: sanitizedUser, token: token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Login Edge Function error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Lỗi máy chủ nội bộ' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});