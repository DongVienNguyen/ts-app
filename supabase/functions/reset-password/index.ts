// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// @ts-ignore
import bcrypt from 'npm:bcryptjs@2.4.3';

// Deno global declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, currentPassword, newPassword } = await req.json();

    if (!username || !currentPassword || !newPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Thiếu thông tin bắt buộc' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user data
    const { data: staff, error: fetchError } = await supabaseAdmin
      .from('staff')
      .select('*')
      .ilike('username', username.toLowerCase().trim())
      .maybeSingle();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Lỗi hệ thống khi tìm người dùng' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!staff) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Không tìm thấy người dùng' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if account is locked
    if (staff.account_status === 'locked') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Tài khoản đã bị khóa. Hãy liên hệ Admin.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, staff.password);
    
    if (!isCurrentPasswordValid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Mật khẩu hiện tại không đúng' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, staff.password);
    if (isSamePassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Mật khẩu mới phải khác mật khẩu hiện tại' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Update password (will be hashed by the trigger)
    const { error: updateError } = await supabaseAdmin
      .from('staff')
      .update({ password: newPassword })
      .eq('id', staff.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Lỗi cập nhật mật khẩu' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Đổi mật khẩu thành công'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Lỗi máy chủ nội bộ' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});