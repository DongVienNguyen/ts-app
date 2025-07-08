import { supabase } from '@/integrations/supabase/client';
// Xóa bỏ import VAPID_PUBLIC_KEY từ '@/config'
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission() {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
}

export async function subscribeUserToPush(username: string) {
  console.log("--- Bắt đầu quá trình đăng ký Push Notification ---");
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error("Trình duyệt không hỗ trợ thông báo đẩy.");
    return;
  }

  try {
    // Wait until we have a valid user session from Supabase client
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !authUser) {
      console.error("Lỗi xác thực hoặc không tìm thấy người dùng, không thể đăng ký push. Lỗi:", userError?.message);
      toast.error("Lỗi xác thực, không thể bật thông báo đẩy.");
      return;
    }
    console.log("Xác thực người dùng thành công, tiến hành đăng ký push.");

    const swRegistration = await navigator.serviceWorker.ready;
    let subscription = await swRegistration.pushManager.getSubscription();

    // Lấy VAPID_PUBLIC_KEY từ biến môi trường của Vite
    const applicationServerKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);

    if (subscription) {
      const currentKey = subscription.options.applicationServerKey ?
        btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.options.applicationServerKey)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '') : null;

      if (currentKey !== import.meta.env.VITE_VAPID_PUBLIC_KEY) { // So sánh với biến môi trường
        console.log("Phát hiện VAPID key khác. Hủy đăng ký cũ và tạo đăng ký mới.");
        await subscription.unsubscribe();
        subscription = null; // Set to null to re-subscribe
      }
    }

    if (!subscription) {
      console.log("Đang tiến hành đăng ký mới với Push Service...");
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
      console.log("Đăng ký mới thành công:", subscription);
    } else {
      console.log("Người dùng đã được đăng ký:", subscription);
    }

    console.log("Đang gửi subscription lên Supabase...");
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert({ username: username, subscription: subscription.toJSON() }, { onConflict: 'username' });

    if (upsertError) {
      console.error('Lỗi khi lưu push subscription vào Supabase:', upsertError);
      toast.error(`Không thể lưu cài đặt thông báo: ${upsertError.message}`);
    } else {
      console.log('Lưu push subscription thành công.');
      localStorage.setItem(`pushSubscribed_${username}`, 'true');
    }
  } catch (error) {
    console.error('Lỗi trong quá trình đăng ký push notification:', error);
    toast.error("Đã xảy ra lỗi khi bật thông báo đẩy.");
  }
}