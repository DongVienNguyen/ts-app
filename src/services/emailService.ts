import { supabase } from '@/integrations/supabase/client';

export interface ErrorReportData {
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
}

export async function sendErrorReport(
  reporterName: string,
  reporterEmail: string,
  errorData: ErrorReportData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'error_report',
        to: 'admin@company.com',
        subject: `Báo cáo lỗi: ${errorData.title}`,
        data: {
          reporterName,
          reporterEmail,
          ...errorData
        }
      }
    });

    if (error) {
      console.error('Error sending error report:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending error report:', error);
    return { success: false, error: 'Không thể gửi báo cáo lỗi' };
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'general',
        to,
        subject,
        html: htmlContent
      }
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Không thể gửi email' };
  }
}

export async function sendAssetNotificationEmail(
  recipients: string[],
  subject: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'asset_notification',
        to: recipients,
        subject,
        html: content
      }
    });

    if (error) {
      console.error('Error sending asset notification email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending asset notification email:', error);
    return { success: false, error: 'Không thể gửi email thông báo tài sản' };
  }
}

export async function sendAssetTransactionConfirmation(
  username: string,
  transactions: any[],
  isSuccess: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'transaction_confirmation',
        to: `${username}@company.com`,
        subject: isSuccess ? 'Xác nhận giao dịch tài sản thành công' : 'Giao dịch tài sản thất bại',
        data: {
          username,
          transactions,
          isSuccess
        }
      }
    });

    if (error) {
      console.error('Error sending transaction confirmation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending transaction confirmation:', error);
    return { success: false, error: 'Không thể gửi email xác nhận giao dịch' };
  }
}

export async function testEmailFunction(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'test',
        to: `${username}@company.com`,
        subject: 'Test Email Function',
        html: 'This is a test email to verify the email function is working correctly.'
      }
    });

    if (error) {
      console.error('Error testing email function:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error testing email function:', error);
    return { success: false, error: 'Không thể test email function' };
  }
}