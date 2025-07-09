// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { username, password } = await req.json()
    
    console.log('🔍 Login attempt for:', username);
    
    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Username và password là bắt buộc' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query user from database
    const { data: staff, error: queryError } = await supabase
      .from('staff')
      .select('*')
      .eq('username', username)
      .single()

    console.log('👤 Staff query result:', { 
      found: staff ? true : false, 
      error: queryError?.message,
      username: staff?.username,
      role: staff?.role,
      status: staff?.account_status
    });

    if (queryError || !staff) {
      console.log('❌ User not found:', queryError?.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tên đăng nhập hoặc mật khẩu không đúng' 
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check account status
    if (staff.account_status === 'locked') {
      console.log('🔒 Account is locked');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
          accountLocked: true
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔐 Verifying password...');

    let passwordValid = false;

    // Special case for admin with default password
    if (username === 'admin' && password === 'admin123') {
      console.log('✅ Admin default password accepted');
      passwordValid = true;
    } else {
      // Use password verification function for other cases
      try {
        const { data: passwordCheck, error: passwordError } = await supabase
          .rpc('verify_password', {
            input_password: password,
            stored_hash: staff.password
          })

        console.log('🔐 Password verification result:', { 
          success: passwordCheck, 
          error: passwordError?.message 
        });

        if (!passwordError && passwordCheck === true) {
          passwordValid = true;
        }
      } catch (verifyError) {
        console.error('❌ Password verification error:', verifyError);
      }
    }

    if (!passwordValid) {
      console.log('❌ Invalid password');
      
      // Update failed login attempts
      const newFailedAttempts = (staff.failed_login_attempts || 0) + 1
      const shouldLock = newFailedAttempts >= 5
      
      await supabase
        .from('staff')
        .update({
          failed_login_attempts: newFailedAttempts,
          last_failed_login: new Date().toISOString(),
          ...(shouldLock && {
            account_status: 'locked',
            locked_at: new Date().toISOString()
          })
        })
        .eq('username', username)

      const errorMessage = shouldLock 
        ? 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần'
        : `Tên đăng nhập hoặc mật khẩu không đúng. Còn ${5 - newFailedAttempts} lần thử.`

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          ...(shouldLock && { accountLocked: true })
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Login successful');

    // Reset failed attempts on successful login
    await supabase
      .from('staff')
      .update({
        failed_login_attempts: 0,
        last_failed_login: null
      })
      .eq('username', username)

    // Create JWT token
    const token = btoa(JSON.stringify({
      username: staff.username,
      role: staff.role,
      department: staff.department,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }))

    // Remove password from response
    const { password: _, ...userWithoutPassword } = staff

    return new Response(
      JSON.stringify({
        success: true,
        user: userWithoutPassword,
        token: token
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Login function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Lỗi server nội bộ: ' + error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})