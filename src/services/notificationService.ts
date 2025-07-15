import { supabase } from '@/integrations/supabase/client';
import { updateSystemStatus, logSystemMetric } from '@/services/systemLogService';

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Test push notification service
  async testPushNotificationService() {
    const startTime = performance.now();
    
    try {
      // Test with a simple payload to check if the service is available
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: { 
          username: 'test_user', 
          payload: { 
            title: 'Health Check', 
            body: 'Testing push notification service' 
          } 
        }
      });

      const responseTime = Math.round(performance.now() - startTime);

      // Even if no subscriptions found, service is working
      const isWorking = !error || (error && data?.message?.includes('No push subscriptions'));

      await updateSystemStatus({
        service_name: 'push_notification',
        status: isWorking ? 'online' : 'offline',
        response_time_ms: responseTime,
        uptime_percentage: isWorking ? 100 : 0,
        status_data: {
          lastCheck: new Date().toISOString(),
          responseTime,
          result: isWorking ? 'success' : 'failed',
          error: error?.message || null
        }
      });

      // Log performance metric
      await logSystemMetric({
        metric_type: 'performance',
        metric_name: 'push_notification_response_time',
        metric_value: responseTime,
        metric_unit: 'ms'
      });

      console.log('✅ Push notification service health check completed');

    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      
      await updateSystemStatus({
        service_name: 'push_notification',
        status: 'offline',
        response_time_ms: responseTime,
        uptime_percentage: 0,
        status_data: {
          lastCheck: new Date().toISOString(),
          result: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      console.error('❌ Push notification service health check failed:', error);
      throw error;
    }
  }

  // Send push notification to user
  async sendPushNotification(username: string, payload: any) {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: { username, payload }
      });

      if (error) {
        console.error('Push notification error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Push notification sent successfully:', data);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(username: string, subscription: PushSubscription) {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          username,
          subscription: subscription.toJSON()
        });

      if (error) throw error;

      console.log('✅ Push subscription saved successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to save push subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(username: string, endpoint: string) {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('username', username)
        .eq('subscription->>endpoint', endpoint);

      if (error) throw error;

      console.log('✅ Push subscription removed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to remove push subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export missing function
export async function sendPushNotification(username: string, payload: any) {
  return notificationService.sendPushNotification(username, payload);
}