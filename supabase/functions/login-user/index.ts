// @deno-types="https://deno.land/x/supabase@1.0.0/src/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log('🔐 Login request received');
    
    const { username, password } = await req.json()
    
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Username và password là bắt buộc' 
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🔍 Attempting login for user: ${username}`);

    // Query staff table with password verification
    const { data: staff, error: queryError } = await supabase
      .from('staff')
      .select('*')
      .eq('username', username)
      .single()

    if (queryError) {
      console.log('❌ Database query error:', queryError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Lỗi truy vấn cơ sở dữ liệu' 
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      )
    }

    if (!staff) {
      console.log('❌ User not found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tên đăng nhập hoặc mật khẩu không đúng' 
        }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      )
    }

    // Check account status
    if (staff.account_status === 'locked') {
      console.log('❌ Account is locked');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
          accountLocked: true
        }),
        { 
          status: 403,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      )
    }

    // Verify password using PostgreSQL crypt function
    const { data: passwordCheck, error: passwordError } = await supabase
      .rpc('verify_password', {
        input_password: password,
        stored_hash: staff.password
      })

    if (passwordError) {
      console.log('❌ Password verification error:', passwordError);
      
      // Increment failed login attempts
      await supabase
        .from('staff')
        .update({
          failed_login_attempts: (staff.failed_login_attempts || 0) + 1,
          last_failed_login: new Date().toISOString()
        })
        .eq('username', username)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Lỗi xác thực mật khẩu' 
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      )
    }

    if (!passwordCheck) {
      console.log('❌ Invalid password');
      
      const newFailedAttempts = (staff.failed_login_attempts || 0) + 1
      const shouldLock = newFailedAttempts >= 5
      
      // Update failed login attempts and potentially lock account
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
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        }
      )
    }

    // Reset failed login attempts on successful login
    await supabase
      .from('staff')
      .update({
        failed_login_attempts: 0,
        last_failed_login: null
      })
      .eq('username', username)

    console.log('✅ Login successful');

    // Generate a simple JWT token (in production, use proper JWT library)
    const token = btoa(JSON.stringify({
      username: staff.username,
      role: staff.role,
      department: staff.department,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }))

    // Return user data without password
    const { password: _, ...userWithoutPassword } = staff

    return new Response(
      JSON.stringify({
        success: true,
        user: userWithoutPassword,
        token: token
      }),
      { 
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('❌ Login function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Lỗi server nội bộ' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})