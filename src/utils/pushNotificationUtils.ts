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
      
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log('Người dùng đã đăng ký push notifications:', subscription);
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('username')
          .eq('username', username)
          .eq('subscription', subscription.toJSON() as Json)
          .single();

        if (data && !error) {
          console.log('Existing subscription is valid for current user.');
          return;
        } else {
          console.warn('Existing subscription found but not for current user or DB error, re-subscribing.');
          await subscription.unsubscribe();
        }
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('Đăng ký push notification thành công:', subscription);
      logSecurityEvent('PUSH_SUBSCRIPTION_SUCCESS', { username: user.username });

      const subscriptionJson: Json = subscription.toJSON() as Json; 

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .insert({ 
          username: user.username, 
          subscription: subscriptionJson 
        });

      if (dbError) {
        console.error('Lỗi khi lưu subscription vào DB:', dbError);
        logSecurityEvent('PUSH_DB_SAVE_FAIL', { username: user.username, error: dbError.message });
      } else {
        console.log('Lưu subscription vào DB thành công.');
      }
    }
  } catch (error) {
    console.error('Lỗi trong quá trình đăng ký push notification:', error);
    logSecurityEvent('PUSH_SUBSCRIPTION_EXCEPTION', { username: user.username, error: (error as Error).message });
  }
}