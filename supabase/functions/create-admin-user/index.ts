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
    const { username, password, staff_name, email, department } = await req.json()
    
    console.log('🔧 Creating admin user via Edge Function...');
    
    if (!username || !password || !email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Username, password và email là bắt buộc' 
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
    
    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Delete existing admin first
    const { error: deleteError } = await supabase
      .from('staff')
      .delete()
      .eq('username', username);

    if (deleteError) {
      console.log('Delete existing admin (might be normal):', deleteError.message);
    }

    // Create new admin user
    const { data: newAdmin, error: createError } = await supabase
      .from('staff')
      .insert({
        username: username,
        password: password, // Will be hashed by trigger
        staff_name: staff_name || 'System Administrator',
        role: 'admin',
        email: email,
        account_status: 'active',
        department: department || 'IT',
        failed_login_attempts: 0
      })
      .select('id, username, email, staff_name, role')
      .single();

    if (createError) {
      console.error('❌ Create admin error:', createError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Cannot create admin: ${createError.message}` 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Admin user created successfully:', newAdmin);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          staff_name: newAdmin.staff_name,
          role: newAdmin.role
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Create admin function error:', error)
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