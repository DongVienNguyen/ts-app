import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Default cleanup policies for different table types
const DEFAULT_POLICIES = [
  // Critical system tables - longer retention
  { table_name: 'security_events', retention_days: 90, is_enabled: true },
  { table_name: 'system_errors', retention_days: 90, is_enabled: true },
  { table_name: 'system_alerts', retention_days: 60, is_enabled: true },
  { table_name: 'user_sessions', retention_days: 60, is_enabled: true },
  
  // Metrics and monitoring - medium retention
  { table_name: 'system_metrics', retention_days: 45, is_enabled: true },
  { table_name: 'system_status', retention_days: 45, is_enabled: true },
  
  // Notifications and reminders - shorter retention
  { table_name: 'notifications', retention_days: 15, is_enabled: true }, // Changed to 15 days
  { table_name: 'sent_asset_reminders', retention_days: 15, is_enabled: true }, // Changed to 15 days
  { table_name: 'sent_crc_reminders', retention_days: 15, is_enabled: true }, // Changed to 15 days
  
  // Push subscriptions - keep longer as they're user preferences
  { table_name: 'push_subscriptions', retention_days: 180, is_enabled: false }, // Disabled by default
  
  // Reminder configurations - keep longer as they're active configurations
  { table_name: 'crc_reminders', retention_days: 365, is_enabled: false }, // Disabled by default
  { table_name: 'asset_reminders', retention_days: 365, is_enabled: false }, // Disabled by default
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🔧 Setting up default cleanup policies...')

    const results = []

    for (const policy of DEFAULT_POLICIES) {
      try {
        // Check if policy already exists
        const { data: existing, error: checkError } = await supabase
          .from('log_cleanup_policies')
          .select('*')
          .eq('table_name', policy.table_name)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error(`❌ Error checking existing policy for ${policy.table_name}:`, checkError)
          results.push({
            table: policy.table_name,
            success: false,
            action: 'check',
            error: checkError.message
          })
          continue
        }

        if (existing) {
          console.log(`ℹ️ Policy already exists for ${policy.table_name}, skipping...`)
          results.push({
            table: policy.table_name,
            success: true,
            action: 'skipped',
            message: 'Policy already exists'
          })
          continue
        }

        // Insert new policy
        const { error: insertError } = await supabase
          .from('log_cleanup_policies')
          .insert(policy)

        if (insertError) {
          console.error(`❌ Error creating policy for ${policy.table_name}:`, insertError)
          results.push({
            table: policy.table_name,
            success: false,
            action: 'insert',
            error: insertError.message
          })
          continue
        }

        console.log(`✅ Created policy for ${policy.table_name} (${policy.retention_days} days, enabled: ${policy.is_enabled})`)
        results.push({
          table: policy.table_name,
          success: true,
          action: 'created',
          retention_days: policy.retention_days,
          is_enabled: policy.is_enabled
        })

      } catch (error) {
        console.error(`❌ Unexpected error processing ${policy.table_name}:`, error)
        results.push({
          table: policy.table_name,
          success: false,
          action: 'error',
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`🎉 Setup completed. ${successCount} policies processed successfully, ${failureCount} failures.`)

    return new Response(JSON.stringify({
      success: true,
      message: `Setup completed. ${successCount} policies processed successfully.`,
      total_policies: DEFAULT_POLICIES.length,
      successful: successCount,
      failed: failureCount,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Fatal error in setup process:', error)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Setup failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})