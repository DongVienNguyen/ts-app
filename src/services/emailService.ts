import { supabase } from '@/integrations/supabase/client';
import { captureError, measurePerformance, updateSystemStatus } from '@/utils/errorTracking';

// Send asset notification email
export const sendAssetNotificationEmail = measurePerformance('sendAssetNotificationEmail', async (recipients: string[], subject: string, content: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: { recipients, subject, content }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    captureError(error as Error, {
      functionName: 'sendAssetNotificationEmail',
      severity: 'high',
      error_data: { recipients, subject }
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Send asset transaction confirmation
export const sendAssetTransactionConfirmation = measurePerformance('sendAssetTransactionConfirmation', async (username: string, transactions: any[], success: boolean) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: { 
        username, 
        transactions, 
        success,
        type: 'transaction_confirmation'
      }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    captureError(error as Error, {
      functionName: 'sendAssetTransactionConfirmation',
      severity: 'high',
      error_data: { username, transactionCount: transactions.length }
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Send error report
export const sendErrorReport = measurePerformance('sendErrorReport', async (username: string, email: string, errorData: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: { 
        username, 
        email,
        errorData,
        type: 'error_report'
      }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    captureError(error as Error, {
      functionName: 'sendErrorReport',
      severity: 'high',
      error_data: { username, errorData }
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Test email function
export const testEmailFunction = measurePerformance('testEmailFunction', async (username: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('test-resend-api', {
      body: { username }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    captureError(error as Error, {
      functionName: 'testEmailFunction',
      severity: 'medium',
      error_data: { username }
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export const emailService = {
  // Send notification email with error tracking
  sendNotificationEmail: measurePerformance('sendNotificationEmail', async (emailData: any) => {
    try {
      // Update email service status to online
      await updateSystemStatus({
        service_name: 'email',
        status: 'online',
        uptime_percentage: 100
      });

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: emailData
      });

      if (error) throw error;
      return data;
    } catch (error) {
      // Update email service status to degraded/offline
      await updateSystemStatus({
        service_name: 'email',
        status: 'degraded',
        uptime_percentage: 75,
        status_data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      captureError(error as Error, {
        functionName: 'sendNotificationEmail',
        severity: 'high',
        error_data: { emailData }
      });
      throw error;
    }
  }),

  // Send asset reminder emails with error tracking
  sendAssetReminderEmails: measurePerformance('sendAssetReminderEmails', async (reminders: any[]) => {
    try {
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const reminder of reminders) {
        try {
          const result = await emailService.sendNotificationEmail(reminder);
          results.push({ success: true, reminder, result });
          successCount++;
        } catch (error) {
          results.push({ success: false, reminder, error });
          errorCount++;
        }
      }

      // Update service status based on success rate
      const successRate = successCount / reminders.length;
      await updateSystemStatus({
        service_name: 'email',
        status: successRate > 0.8 ? 'online' : successRate > 0.5 ? 'degraded' : 'offline',
        uptime_percentage: successRate * 100,
        status_data: { 
          totalSent: reminders.length,
          successCount,
          errorCount,
          successRate: successRate * 100
        }
      });

      return results;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'sendAssetReminderEmails',
        severity: 'critical',
        error_data: { reminderCount: reminders.length }
      });
      throw error;
    }
  }),

  // Test email service health
  testEmailService: measurePerformance('testEmailService', async () => {
    try {
      const { data, error } = await supabase.functions.invoke('test-resend-api');
      
      if (error) throw error;

      await updateSystemStatus({
        service_name: 'email',
        status: 'online',
        uptime_percentage: 100,
        status_data: { lastTest: new Date().toISOString(), result: 'success' }
      });

      return data;
    } catch (error) {
      await updateSystemStatus({
        service_name: 'email',
        status: 'offline',
        uptime_percentage: 0,
        status_data: { 
          lastTest: new Date().toISOString(), 
          result: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      captureError(error as Error, {
        functionName: 'testEmailService',
        severity: 'critical'
      });
      throw error;
    }
  })
};