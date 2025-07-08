// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Type declarations for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get staff information
    const { data: staff, error: fetchError } = await supabaseAdmin
      .from('staff')
      .select('account_status, failed_login_attempts, last_failed_login, locked_at')
      .ilike('username', username.toLowerCase().trim())
      .maybeSingle();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!staff) {
      return new Response(JSON.stringify({ 
        isLocked: false, 
        failedAttempts: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if account is locked
    const isLocked = staff.account_status === 'locked';
    const failedAttempts = staff.failed_login_attempts || 0;
    
    // Calculate when user can retry (24 hours after last failed attempt)
    let canRetryAt = null;
    if (staff.last_failed_login && failedAttempts >= 3) {
      const lastAttempt = new Date(staff.last_failed_login);
      canRetryAt = new Date(lastAttempt.getTime() + 24 * 60 * 60 * 1000);
      
      // If 24 hours have passed, reset failed attempts
      if (new Date() > canRetryAt) {
        await supabaseAdmin
          .from('staff')
          .update({ 
            failed_login_attempts: 0,
            account_status: 'active',
            last_failed_login: null,
            locked_at: null
          })
          .eq('username', username.toLowerCase().trim());
        
        return new Response(JSON.stringify({ 
          isLocked: false, 
          failedAttempts: 0 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ 
      isLocked,
      failedAttempts,
      canRetryAt: canRetryAt ? canRetryAt.toISOString() : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Check account status error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});