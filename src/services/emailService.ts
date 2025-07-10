import { supabase } from '@/integrations/supabase/client';
import { updateSystemStatus, logSystemMetric } from '@/utils/errorTracking';

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Test email service
  async testEmailService() {
    const startTime = performance.now();
    
    try {
      // Test with a simple email to check if the service is available
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: { 
          to: 'test@example.com',
          subject: 'Health Check',
          html: '<p>Testing email service</p>'
        }
      });

      const responseTime = Math.round(performance.now() - startTime);

      // Check if service responded (even if email wasn't sent due to invalid address)
      const isWorking = !error || (error && !error.message?.includes('network'));

      await updateSystemStatus({
        service_name: 'email',
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
        metric_name: 'email_service_response_time',
        metric_value: responseTime,
        metric_unit: 'ms'
      });

      console.log('✅ Email service health check completed');

    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      
      await updateSystemStatus({
        service_name: 'email',
        status: 'offline',
        response_time_ms: responseTime,
        uptime_percentage: 0,
        status_data: {
          lastCheck: new Date().toISOString(),
          result: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      console.error('❌ Email service health check failed:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: { to, subject, html }
      });

      if (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Email sent successfully:', data);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send bulk emails
  async sendBulkEmails(emails: Array<{ to: string; subject: string; html: string }>) {
    const results = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email.to, email.subject, email.html);
      results.push({ ...email, ...result });
      
      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Export missing functions with proper error handling
export async function sendAssetNotificationEmail(recipients: string[], subject: string, content: string) {
  const results = [];
  let hasError = false;
  let errorMessage = '';
  
  for (const recipient of recipients) {
    const result = await emailService.sendEmail(recipient, subject, content);
    results.push({ recipient, ...result });
    
    if (!result.success) {
      hasError = true;
      errorMessage = result.error || 'Unknown error';
    }
  }
  
  return { 
    success: results.every(r => r.success), 
    results,
    error: hasError ? errorMessage : undefined
  };
}

export async function sendAssetTransactionConfirmation(username: string, transactions: any[], isSuccess: boolean) {
  const subject = isSuccess ? 'Xác nhận giao dịch tài sản thành công' : 'Giao dịch tài sản thất bại';
  const content = `
    <h2>${subject}</h2>
    <p>Người dùng: ${username}</p>
    <p>Số lượng giao dịch: ${transactions.length}</p>
    <p>Trạng thái: ${isSuccess ? 'Thành công' : 'Thất bại'}</p>
    <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
  `;
  
  return emailService.sendEmail(`${username}@company.com`, subject, content);
}

export async function sendErrorReport(reporterName: string, reporterEmail: string, errorData: any) {
  const subject = `Báo cáo lỗi từ ${reporterName}`;
  const content = `
    <h2>Báo cáo lỗi hệ thống</h2>
    <p><strong>Người báo cáo:</strong> ${reporterName}</p>
    <p><strong>Email:</strong> ${reporterEmail}</p>
    <p><strong>Tiêu đề:</strong> ${errorData.title}</p>
    <p><strong>Mô tả:</strong> ${errorData.description}</p>
    <p><strong>Các bước tái hiện:</strong> ${errorData.stepsToReproduce || 'Không có'}</p>
    <p><strong>Kết quả mong đợi:</strong> ${errorData.expectedResult || 'Không có'}</p>
    <p><strong>Kết quả thực tế:</strong> ${errorData.actualResult || 'Không có'}</p>
    <p><strong>Thời gian:</strong> ${errorData.timestamp}</p>
    <p><strong>User Agent:</strong> ${errorData.userAgent}</p>
    <p><strong>URL:</strong> ${errorData.url}</p>
  `;
  
  return emailService.sendEmail('admin@company.com', subject, content);
}

export async function testEmailFunction(username: string) {
  const subject = 'Test Email Function';
  const content = `<p>This is a test email for user: ${username}</p>`;
  return emailService.sendEmail(`${username}@company.com`, subject, content);
}