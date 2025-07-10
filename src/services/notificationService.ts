import { supabase } from '@/integrations/supabase/client';
import { captureError, measurePerformance, updateSystemStatus } from '@/utils/errorTracking';

// Send push notification
export const sendPushNotification = measurePerformance('sendPushNotification', async (username: string, payload: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: { username, payload }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    captureError(error as Error, {
      functionName: 'sendPushNotification',
      severity: 'high',
      error_data: { username, payload }
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export const notificationService = {
  // Send push notification with error tracking
  sendPushNotification: measurePerformance('sendPushNotification', async (notificationData: any) => {
    try {
      // Update push notification service status
      await updateSystemStatus({
        service_name: 'push_notification',
        status: 'online',
        uptime_percentage: 100
      });

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: notificationData
      });

      if (error) throw error;
      return data;
    } catch (error) {
      // Update service status to degraded
      await updateSystemStatus({
        service_name: 'push_notification',
        status: 'degraded',
        uptime_percentage: 75,
        status_data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      captureError(error as Error, {
        functionName: 'sendPushNotification',
        severity: 'high',
        error_data: { notificationData }
      });
      throw error;
    }
  }),

  // Create in-app notification with error tracking
  createNotification: measurePerformance('createNotification', async (notification: any) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'createNotification',
        severity: 'medium',
        error_data: { notification }
      });
      throw error;
    }
  }),

  // Get user notifications with error tracking
  getUserNotifications: measurePerformance('getUserNotifications', async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_username', username)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'getUserNotifications',
        severity: 'medium',
        error_data: { username }
      });
      throw error;
    }
  }),

  // Mark notification as read with error tracking
  markNotificationAsRead: measurePerformance('markNotificationAsRead', async (notificationId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'markNotificationAsRead',
        severity: 'low',
        error_data: { notificationId }
      });
      throw error;
    }
  }),

  // Test push notification service
  testPushNotificationService: measurePerformance('testPushNotificationService', async () => {
    try {
      // Test by sending a test notification
      const testData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        username: 'system_test'
      };

      const result = await notificationService.sendPushNotification(testData);

      await updateSystemStatus({
        service_name: 'push_notification',
        status: 'online',
        uptime_percentage: 100,
        status_data: { lastTest: new Date().toISOString(), result: 'success' }
      });

      return result;
    } catch (error) {
      await updateSystemStatus({
        service_name: 'push_notification',
        status: 'offline',
        uptime_percentage: 0,
        status_data: { 
          lastTest: new Date().toISOString(), 
          result: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      captureError(error as Error, {
        functionName: 'testPushNotificationService',
        severity: 'critical'
      });
      throw error;
    }
  })
};