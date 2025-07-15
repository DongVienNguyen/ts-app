import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import emailService from '@/services/emailService';
import { formatEmail } from '@/utils/emailUtils';
import { SystemError } from '@/types/system';

interface NotificationOptions {
  disableEmail?: boolean;
  disablePush?: boolean;
}

async function getAdmins() {
  const { data: admins, error: adminError } = await supabase
    .from('staff')
    .select('username, email')
    .eq('role', 'admin');

  if (adminError) {
    console.error('Failed to fetch admins for notification:', adminError);
    return [];
  }
  if (!admins || admins.length === 0) {
    console.warn('No admins found to send notifications to.');
    return [];
  }
  return admins;
}

async function sendInAppNotifications(admins: { username: string }[], errorData: SystemError) {
  const payload = {
    title: `Lỗi Hệ thống: ${errorData.severity?.toUpperCase()}`,
    message: errorData.error_message.substring(0, 250),
    notification_type: 'system_error',
    related_data: {
      error_type: errorData.error_type,
      function_name: errorData.function_name,
      message: errorData.error_message,
    },
  };
  const promises = admins.map(admin => supabase.from('notifications').insert({ ...payload, recipient_username: admin.username }));
  try {
    await Promise.all(promises);
    console.log(`✅ In-app notifications created for ${admins.length} admins.`);
  } catch (dbError) {
    console.error('❌ Failed to create in-app notifications:', dbError);
  }
}

async function sendEmailAndPushNotifications(admins: { username: string, email: string | null }[], errorData: SystemError, options: NotificationOptions) {
  const pushPayload = {
    title: `Lỗi Hệ thống: ${errorData.severity?.toUpperCase()}`,
    body: errorData.error_message.substring(0, 100),
    data: { url: '/error-monitoring' },
  };
  const emailSubject = `[Cảnh báo] Lỗi Hệ thống Mức độ ${errorData.severity?.toUpperCase()}`;
  const emailHtml = `<h1>Cảnh báo Lỗi Hệ thống</h1><p>Một lỗi mới đã được ghi nhận:</p><ul><li><strong>Mức độ:</strong> ${errorData.severity}</li><li><strong>Loại lỗi:</strong> ${errorData.error_type}</li><li><strong>Thông báo:</strong> ${errorData.error_message}</li><li><strong>Hàm:</strong> ${errorData.function_name || 'N/A'}</li><li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li></ul><p>Vui lòng truy cập trang Giám sát Hệ thống để xem chi tiết.</p>`;
  const severity = errorData.severity;

  const handleNotifications = async (sendEmail: boolean, sendPush: boolean) => {
    if (sendEmail) {
      const emails = admins.map(admin => formatEmail(admin.email || admin.username)).filter(Boolean);
      if (emails.length > 0) await emailService.sendEmail({ to: emails, subject: emailSubject, html: emailHtml });
    }
    if (sendPush) {
      for (const admin of admins) await notificationService.sendPushNotification(admin.username, pushPayload);
    }
  };

  if (errorData.error_type === 'API_SYNC_FAILURE') {
    const sendEmail = !options.disableEmail;
    const sendPush = !options.disablePush;
    if (sendEmail || sendPush) console.log(`Sending notifications to ${admins.length} admins for API_SYNC_FAILURE.`);
    else console.log(`⚠️ Đã bỏ qua email/push notification cho lỗi ${errorData.error_type} theo cấu hình.`);
    await handleNotifications(sendEmail, sendPush);
  } else {
    if (severity === 'critical' || severity === 'high') {
      console.log(`Sending email and push notifications to ${admins.length} admins for ${severity} error.`);
      await handleNotifications(true, true);
    } else if (severity === 'medium') {
      console.log(`Sending push notifications to ${admins.length} admins for ${severity} error.`);
      await handleNotifications(false, true);
    }
  }
}

export const errorNotifierService = {
  async notifyAdmins(errorData: SystemError, options: NotificationOptions = {}): Promise<void> {
    try {
      const admins = await getAdmins();
      if (admins.length === 0) return;
      await sendInAppNotifications(admins, errorData);
      await sendEmailAndPushNotifications(admins, errorData, options);
    } catch (notificationError) {
      console.error('❌ Failed to send error notifications:', notificationError);
    }
  }
};