import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('🧹 Starting notification cleanup process...')

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

    // Count and delete read notifications older than 30 days
    const { count: readCount, error: readCountError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (readCountError) {
      console.error('❌ Error counting read notifications:', readCountError);
      throw readCountError;
    }

    let deletedReadCount = 0;
    if (readCount && readCount > 0) {
      const { data: deletedRead, error: deleteReadError } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select('id');

      if (deleteReadError) {
        console.error('❌ Error deleting read notifications:', deleteReadError);
        throw deleteReadError;
      }

      deletedReadCount = deletedRead?.length || 0;
      console.log(`✅ Deleted ${deletedReadCount} read notifications older than 30 days`);
    } else {
      console.log('ℹ️ No read notifications older than 30 days found');
    }

    // Count and delete unread notifications older than 180 days
    const { count: unreadCount, error: unreadCountError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .lt('created_at', oneEightyDaysAgo.toISOString());

    if (unreadCountError) {
      console.error('❌ Error counting unread notifications:', unreadCountError);
      throw unreadCountError;
    }

    let deletedUnreadCount = 0;
    if (unreadCount && unreadCount > 0) {
      const { data: deletedUnread, error: deleteUnreadError } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', false)
        .lt('created_at', oneEightyDaysAgo.toISOString())
        .select('id');

      if (deleteUnreadError) {
        console.error('❌ Error deleting unread notifications:', deleteUnreadError);
        throw deleteUnreadError;
      }

      deletedUnreadCount = deletedUnread?.length || 0;
      console.log(`✅ Deleted ${deletedUnreadCount} unread notifications older than 180 days`);
    } else {
      console.log('ℹ️ No unread notifications older than 180 days found');
    }

    const totalDeleted = deletedReadCount + deletedUnreadCount;
    console.log(`🎉 Notification cleanup completed. Total deleted: ${totalDeleted}`);

    // Log cleanup metrics
    try {
      await supabase.from('system_metrics').insert({
        metric_type: 'cleanup',
        metric_name: 'notification_cleanup_completed',
        metric_value: totalDeleted,
        metric_unit: 'records',
        additional_data: {
          deleted_read_count: deletedReadCount,
          deleted_unread_count: deletedUnreadCount,
          read_cutoff_date: thirtyDaysAgo.toISOString(),
          unread_cutoff_date: oneEightyDaysAgo.toISOString()
        }
      });
    } catch (metricError) {
      console.warn('⚠️ Failed to log cleanup metric:', metricError);
    }

    const response = {
      success: true,
      message: "Notification cleanup successful.",
      deletedReadCount,
      deletedUnreadCount,
      totalDeleted,
      readCutoffDate: thirtyDaysAgo.toISOString(),
      unreadCutoffDate: oneEightyDaysAgo.toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('❌ Fatal error in notification cleanup:', error);
    
    // Try to log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      
      await supabase.from('system_errors').insert({
        error_type: 'NotificationCleanupError',
        error_message: error.message,
        error_stack: error.stack,
        function_name: 'cleanup-old-notifications',
        severity: 'medium',
        status: 'open',
        error_data: {
          timestamp: new Date().toISOString(),
          error_details: error
        }
      });
    } catch (logError) {
      console.error('❌ Failed to log cleanup error:', logError);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Notification cleanup failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})