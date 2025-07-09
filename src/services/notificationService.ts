import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationData {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export async function sendPushNotification(
  username: string,
  notificationData: PushNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        username,
        notification: notificationData
      }
    });

    if (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: 'Không thể gửi push notification' };
  }
}

export async function createInAppNotification(
  recipientUsername: string,
  title: string,
  message: string,
  notificationType: string,
  relatedData?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_username: recipientUsername,
        title,
        message,
        notification_type: notificationType,
        related_data: relatedData,
        is_read: false
      });

    if (error) {
      console.error('Error creating in-app notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    return { success: false, error: 'Không thể tạo thông báo trong ứng dụng' };
  }
}

export async function sendAssetReminderNotification(
  username: string,
  assetName: string,
  dueDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create in-app notification
    await createInAppNotification(
      username,
      'Nhắc nhở tài sản đến hạn',
      `Tài sản "${assetName}" sẽ đến hạn vào ${dueDate}`,
      'asset_reminder',
      { assetName, dueDate }
    );

    // Send push notification
    await sendPushNotification(username, {
      title: 'Nhắc nhở tài sản đến hạn',
      body: `Tài sản "${assetName}" sẽ đến hạn vào ${dueDate}`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { type: 'asset_reminder', assetName, dueDate }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending asset reminder notification:', error);
    return { success: false, error: 'Không thể gửi thông báo nhắc nhở tài sản' };
  }
}

export async function sendCRCReminderNotification(
  username: string,
  crcType: string,
  executionDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create in-app notification
    await createInAppNotification(
      username,
      'Nhắc nhở duyệt CRC',
      `CRC "${crcType}" cần được duyệt vào ${executionDate}`,
      'crc_reminder',
      { crcType, executionDate }
    );

    // Send push notification
    await sendPushNotification(username, {
      title: 'Nhắc nhở duyệt CRC',
      body: `CRC "${crcType}" cần được duyệt vào ${executionDate}`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { type: 'crc_reminder', crcType, executionDate }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending CRC reminder notification:', error);
    return { success: false, error: 'Không thể gửi thông báo nhắc nhở CRC' };
  }
}

export async function sendTransactionNotification(
  username: string,
  transactionType: string,
  assetCode: string,
  isSuccess: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const title = isSuccess ? 'Giao dịch thành công' : 'Giao dịch thất bại';
    const message = `${transactionType} tài sản ${assetCode} ${isSuccess ? 'thành công' : 'thất bại'}`;

    // Create in-app notification
    await createInAppNotification(
      username,
      title,
      message,
      'transaction_result',
      { transactionType, assetCode, isSuccess }
    );

    // Send push notification
    await sendPushNotification(username, {
      title,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { type: 'transaction_result', transactionType, assetCode, isSuccess }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending transaction notification:', error);
    return { success: false, error: 'Không thể gửi thông báo giao dịch' };
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Không thể đánh dấu thông báo đã đọc' };
  }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Không thể xóa thông báo' };
  }
}