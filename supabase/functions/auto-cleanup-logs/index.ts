import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🧹 Starting automatic log cleanup process...')

    // Get all enabled cleanup policies
    const { data: policies, error: policiesError } = await supabase
      .from('log_cleanup_policies')
      .select('*')
      .eq('is_enabled', true)

    if (policiesError) {
      console.error('❌ Error fetching cleanup policies:', policiesError)
      throw policiesError
    }

    if (!policies || policies.length === 0) {
      console.log('ℹ️ No enabled cleanup policies found')
      return new Response(JSON.stringify({
        success: true,
        message: 'No enabled cleanup policies found',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const results = []
    let totalDeleted = 0

    // Process each enabled policy
    for (const policy of policies) {
      try {
        console.log(`🔄 Processing cleanup for table: ${policy.table_name}`)
        
        // Calculate cutoff date
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days)
        const cutoffISOString = cutoffDate.toISOString()

        console.log(`📅 Cutoff date for ${policy.table_name}: ${cutoffISOString}`)

        // Count records to be deleted first
        const { count: recordCount, error: countError } = await supabase
          .from(policy.table_name)
          .select('*', { count: 'exact', head: true })
          .lt('created_at', cutoffISOString)

        if (countError) {
          console.error(`❌ Error counting records for ${policy.table_name}:`, countError)
          results.push({
            table: policy.table_name,
            success: false,
            error: countError.message,
            deleted_count: 0
          })
          continue
        }

        if (recordCount === 0) {
          console.log(`✅ No old records found in ${policy.table_name}`)
          results.push({
            table: policy.table_name,
            success: true,
            deleted_count: 0,
            message: 'No old records to delete'
          })
          continue
        }

        // Delete old records
        const { error: deleteError } = await supabase
          .from(policy.table_name)
          .delete()
          .lt('created_at', cutoffISOString)

        if (deleteError) {
          console.error(`❌ Error deleting records from ${policy.table_name}:`, deleteError)
          results.push({
            table: policy.table_name,
            success: false,
            error: deleteError.message,
            deleted_count: 0
          })
          continue
        }

        console.log(`✅ Successfully deleted ${recordCount} records from ${policy.table_name}`)
        results.push({
          table: policy.table_name,
          success: true,
          deleted_count: recordCount,
          cutoff_date: cutoffISOString,
          retention_days: policy.retention_days
        })

        totalDeleted += recordCount || 0

      } catch (error) {
        console.error(`❌ Unexpected error processing ${policy.table_name}:`, error)
        results.push({
          table: policy.table_name,
          success: false,
          error: error.message,
          deleted_count: 0
        })
      }
    }

    // Log cleanup completion
    console.log(`🎉 Cleanup completed. Total records deleted: ${totalDeleted}`)

    // Insert a system metric to track cleanup
    try {
      await supabase.from('system_metrics').insert({
        metric_type: 'cleanup',
        metric_name: 'auto_cleanup_completed',
        metric_value: totalDeleted,
        metric_unit: 'records',
        additional_data: {
          policies_processed: policies.length,
          successful_cleanups: results.filter(r => r.success).length,
          failed_cleanups: results.filter(r => !r.success).length,
          results: results
        }
      })
    } catch (metricError) {
      console.warn('⚠️ Failed to log cleanup metric:', metricError)
    }

    // Create system alert if there were failures
    const failedCleanups = results.filter(r => !r.success)
    if (failedCleanups.length > 0) {
      try {
        await supabase.from('system_alerts').insert({
          alert_id: `cleanup_failures_${Date.now()}`,
          rule_id: 'auto_cleanup_failures',
          rule_name: 'Automatic Log Cleanup Failures',
          metric: 'cleanup_failures',
          current_value: failedCleanups.length,
          threshold: 0,
          severity: 'medium',
          message: `${failedCleanups.length} bảng không thể được dọn dẹp tự động: ${failedCleanups.map(f => f.table).join(', ')}`
        })
      } catch (alertError) {
        console.warn('⚠️ Failed to create cleanup failure alert:', alertError)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Cleanup completed successfully. ${totalDeleted} records deleted across ${results.filter(r => r.success).length} tables.`,
      total_deleted: totalDeleted,
      policies_processed: policies.length,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Fatal error in cleanup process:', error)
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      
      await supabase.from('system_errors').insert({
        error_type: 'AutoCleanupError',
        error_message: error.message,
        error_stack: error.stack,
        function_name: 'auto-cleanup-logs',
        severity: 'high',
        status: 'open',
        error_data: {
          timestamp: new Date().toISOString(),
          error_details: error
        }
      })
    } catch (logError) {
      console.error('❌ Failed to log cleanup error:', logError)
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Automatic cleanup failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})