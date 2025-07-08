import { supabase } from '@/integrations/supabase/client';
import { getStoredUser } from '@/utils/authUtils';
import { VAPID_PUBLIC_KEY } from '@/config';
import { logSecurityEvent } from './secureAuthUtils';
import { Json } from '@/integrations/supabase/types';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  logSecurityEvent('NOTIFICATION_PERMISSION_REQUEST', { status: permission });
  return permission;
}

export async function subscribeUserToPush(username: string) {
  console.log("--- Bắt đầu quá trình đăng ký Push Notification ---");
  
  const user = getStoredUser();
  if (!user || !user.username || user.username !== username) {
    const errorMsg = 'Lỗi xác thực hoặc không tìm thấy người dùng, không thể đăng ký push. Lỗi: No stored user found or username mismatch!';
    console.error(errorMsg);
    logSecurityEvent('PUSH_SUBSCRIPTION_FAIL', { reason: 'No stored user or username mismatch' });
    throw new Error(errorMsg);
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      const currentSubscription = await registration.pushManager.getSubscription();

      if (currentSubscription) {
        const existingKey = currentSubscription.options.applicationServerKey;
        const existingKeyArray = existingKey ? new Uint8Array(existingKey) : new Uint8Array(0);
        
        let keysMatch = applicationServerKey.length === existingKeyArray.length;
        if (keysMatch) {
          for (let i = 0; i < applicationServerKey.length; i++) {
            if (applicationServerKey[i] !== existingKeyArray[i]) {
              keysMatch = false;
              break;
            }
          }
        }

        if (keysMatch) {
          console.log('Đã có đăng ký với VAPID key hợp lệ. Đảm bảo đã được lưu trong DB.');
          const { data, error } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('username', user.username)
            .eq('subscription->>endpoint', currentSubscription.endpoint)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = "exact one row not found"
             console.error("Lỗi khi kiểm tra subscription trong DB:", error);
          } else if (!data) {
             console.log("Subscription không có trong DB, đang thêm...");
             const { error: insertError } = await supabase.from('push_subscriptions').insert({ 
                username: user.username, 
                subscription: currentSubscription.toJSON() as Json 
             });
             if (insertError) console.error("Lỗi khi thêm subscription vào DB:", insertError);
          }
          return;
        } else {
          console.warn('Phát hiện VAPID key khác hoặc không có key. Hủy đăng ký cũ và tạo đăng ký mới.');
          await currentSubscription.unsubscribe();
        }
      }

      console.log('Đang tiến hành đăng ký mới với Push Service...');
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      console.log('Đăng ký push notification thành công:', newSubscription);
      logSecurityEvent('PUSH_SUBSCRIPTION_SUCCESS', { username: user.username });

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .insert({ 
          username: user.username, 
          subscription: newSubscription.toJSON() as Json 
        });

      if (dbError) {
        console.error('Lỗi khi lưu subscription mới vào DB:', dbError);
        logSecurityEvent('PUSH_DB_SAVE_FAIL', { username: user.username, error: dbError.message });
      } else {
        console.log('Lưu subscription mới vào DB thành công.');
      }
    }
  } catch (error) {
    console.error('Lỗi trong quá trình đăng ký push notification:', error);
    if (error instanceof Error) {
        logSecurityEvent('PUSH_SUBSCRIPTION_EXCEPTION', { username: user.username, error: `${error.name}: ${error.message}` });
        if (error.name === 'AbortError') {
            console.error('Đăng ký push đã bị hủy (AbortError). Điều này thường xảy ra do VAPID key không hợp lệ hoặc có sự cố với dịch vụ push của trình duyệt. Vui lòng kiểm tra VAPID keys trong cấu hình của bạn.');
        }
    } else {
        logSecurityEvent('PUSH_SUBSCRIPTION_EXCEPTION', { username: user.username, error: 'Unknown error' });
    }
  }
}