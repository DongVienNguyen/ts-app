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

// Helper function to get admin email
async function getAdminEmail(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('email')
      .eq('role', 'admin')
      .limit(1);

    if (error) {
      console.error('Error getting admin email:', error);
      return 'admin@company.com'; // fallback
    }

    if (data && data.length > 0 && data[0].email) {
      return data[0].email;
    }

    return 'admin@company.com'; // fallback
  } catch (error) {
    console.error('Exception getting admin email:', error);
    return 'admin@company.com'; // fallback
  }
}

export async function sendErrorReport(
  reporterName: string,
  reporterEmail: string,
  errorData: ErrorReportData
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = await getAdminEmail();
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'error_report',
        to: adminEmail,
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

    console.log('✅ Error report sent to:', adminEmail);
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
    const { error } = await supabase.functions.invoke('send-notification-email', {
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

    console.log('✅ Email sent to:', to);
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
    const { error } = await supabase.functions.invoke('send-notification-email', {
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

    console.log('✅ Asset notification sent to:', recipients);
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
    const adminEmail = await getAdminEmail();
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'transaction_confirmation',
        to: adminEmail,
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

    console.log('✅ Transaction confirmation sent to:', adminEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending transaction confirmation:', error);
    return { success: false, error: 'Không thể gửi email xác nhận giao dịch' };
  }
}

export async function testEmailFunction(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = await getAdminEmail();
    
    console.log('🧪 Testing email function...');
    console.log('📧 Admin email:', adminEmail);
    console.log('👤 Test user:', username);
    
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        type: 'test',
        to: adminEmail,
        subject: '🧪 Test Email Function - Hệ thống Quản lý Tài sản',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">🧪 Test Email Function</h2>
            <p>Đây là email test để kiểm tra chức năng gửi email của hệ thống.</p>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">📊 Thông tin test:</h3>
              <ul>
                <li><strong>Người test:</strong> ${username}</li>
                <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
                <li><strong>Email admin:</strong> ${adminEmail}</li>
                <li><strong>Trạng thái:</strong> ✅ Thành công</li>
              </ul>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #15803d; margin-top: 0;">🔧 Các chức năng đã test:</h3>
              <ul>
                <li>✅ Kết nối Supabase Edge Function</li>
                <li>✅ Kết nối Resend API</li>
                <li>✅ Template email HTML</li>
                <li>✅ Gửi email đến admin</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Email này được gửi tự động từ Hệ thống Quản lý Tài sản.<br>
              Nếu bạn nhận được email này, chức năng gửi email đang hoạt động bình thường.
            </p>
          </div>
        `
      }
    });

    if (error) {
      console.error('❌ Error testing email function:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Test email sent successfully to:', adminEmail);
    return { success: true };
  } catch (error) {
    console.error('❌ Exception testing email function:', error);
    return { success: false, error: 'Không thể test email function' };
  }
}