import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    toast.error('Trình duyệt này không hỗ trợ thông báo.');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const subscribeUserToPush = async (username: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.warning('Thông báo đẩy không được hỗ trợ trên trình duyệt này.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY;

    // --- DEBUG LOGGING ---
    console.log('--- Bắt đầu quá trình đăng ký Push Notification ---');
    console.log('VAPID Public Key được tải từ .env.local:', VAPID_PUBLIC_KEY);
    // --- END DEBUG LOGGING ---

    if (!VAPID_PUBLIC_KEY) {
      toast.error('VAPID Public Key chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      console.error('VAPID Public Key is not set in environment variables.');
      return;
    }

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const existingKey = subscription.options.applicationServerKey;
      if (existingKey) {
        const currentApplicationServerKey = btoa(String.fromCharCode.apply(null, [...new Uint8Array(existingKey)]));
        if (currentApplicationServerKey !== VAPID_PUBLIC_KEY) {
          console.warn('Phát hiện VAPID key khác. Hủy đăng ký cũ và tạo đăng ký mới.');
          await subscription.unsubscribe();
          subscription = null;
        }
      }
    }

    if (!subscription) {
      console.log('Đang tiến hành đăng ký mới với Push Service...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      console.log('Đăng ký mới thành công:', subscription);
    }

    console.log('Đang gửi subscription lên Supabase...');
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          username: username,
          subscription: subscription as unknown as Json,
        },
        { onConflict: 'username' }
      );

    if (error) {
      console.error('Lỗi khi lưu push subscription vào Supabase:', error);
      toast.error('Không thể lưu đăng ký nhận thông báo. Vui lòng thử lại.');
    } else {
      console.log('Lưu đăng ký nhận thông báo thành công:', data);
      toast.success('Đăng ký nhận thông báo thành công!');
    }
  } catch (error) {
    console.error('Lỗi khi đăng ký nhận thông báo đẩy:', error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      toast.error('Đăng ký thông báo thất bại (AbortError).', {
        description: 'Lỗi này thường do VAPID key không chính xác. Hãy kiểm tra lại Public Key trong file .env.local và các secret trên Supabase. Đảm bảo không có khoảng trắng và chúng khớp nhau.'
      });
    } else if (error instanceof DOMException && error.name === 'InvalidStateError' && error.message.includes('applicationServerKey')) {
      toast.error('Đã có lỗi với khóa thông báo. Vui lòng thử lại hoặc liên hệ quản trị viên.');
    } else {
      toast.error('Không thể đăng ký nhận thông báo. Vui lòng thử lại.');
    }
  }
};

export const unsubscribeUserFromPush = async (username: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('username', username);

      if (error) {
        console.error('Lỗi khi xóa push subscription khỏi Supabase:', error);
        toast.error('Không thể hủy đăng ký nhận thông báo.');
      } else {
        toast.success('Đã hủy đăng ký nhận thông báo thành công.');
      }
    }
  } catch (error) {
    console.error('Lỗi khi hủy đăng ký nhận thông báo đẩy:', error);
    toast.error('Không thể hủy đăng ký nhận thông báo.');
  }
};