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

        // First, get all records to be deleted
        const { data: recordsToDelete, error: fetchError } = await supabase
          .from(policy.table_name)
          .select('id')
          .lt('created_at', cutoffISOString)

        if (fetchError) {
          console.error(`❌ Error fetching records for ${policy.table_name}:`, fetchError)
          results.push({
            table: policy.table_name,
            success: false,
            error: `Fetch error: ${fetchError.message}`,
            deleted_count: 0
          })
          continue
        }

        if (!recordsToDelete || recordsToDelete.length === 0) {
          console.log(`✅ No old records found in ${policy.table_name}`)
          results.push({
            table: policy.table_name,
            success: true,
            deleted_count: 0,
            message: 'No old records to delete'
          })
          continue
        }

        console.log(`📊 Found ${recordsToDelete.length} records to delete in ${policy.table_name}`)

        // Delete records in batches to avoid timeout
        const batchSize = 1000
        let totalDeletedForTable = 0
        
        for (let i = 0; i < recordsToDelete.length; i += batchSize) {
          const batch = recordsToDelete.slice(i, i + batchSize)
          const batchIds = batch.map(r => r.id)
          
          const { data: deletedBatch, error: deleteError } = await supabase
            .from(policy.table_name)
            .delete()
            .in('id', batchIds)
            .select('id')

          if (deleteError) {
            console.error(`❌ Error deleting batch from ${policy.table_name}:`, deleteError)
            results.push({
              table: policy.table_name,
              success: false,
              error: `Delete error: ${deleteError.message}`,
              deleted_count: totalDeletedForTable
            })
            break
          }

          const batchDeletedCount = deletedBatch?.length || 0
          totalDeletedForTable += batchDeletedCount
          console.log(`✅ Deleted batch of ${batchDeletedCount} records from ${policy.table_name}`)
        }

        if (totalDeletedForTable > 0) {
          console.log(`✅ Successfully deleted ${totalDeletedForTable} records from ${policy.table_name}`)
          results.push({
            table: policy.table_name,
            success: true,
            deleted_count: totalDeletedForTable,
            cutoff_date: cutoffISOString,
            retention_days: policy.retention_days
          })

          totalDeleted += totalDeletedForTable
        }

      } catch (error) {
        console.error(`❌ Unexpected error processing ${policy.table_name}:`, error)
        results.push({
          table: policy.table_name,
          success: false,
          error: `Unexpected error: ${error.message}`,
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