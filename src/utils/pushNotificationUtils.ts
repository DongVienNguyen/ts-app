import { supabase } from '@/integrations/supabase/client';
import { VAPID_PUBLIC_KEY } from '@/config';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  console.log('--- Bắt đầu yêu cầu quyền thông báo ---');
  
  if (!('Notification' in window)) {
    console.warn('Trình duyệt không hỗ trợ thông báo');
    return 'denied';
  }

  console.log('Trạng thái quyền hiện tại:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('Quyền thông báo đã được cấp trước đó');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.log('Quyền thông báo đã bị từ chối');
    return 'denied';
  }

  try {
    // Request permission
    console.log('Đang yêu cầu quyền thông báo...');
    const permission = await Notification.requestPermission();
    console.log('Kết quả yêu cầu quyền:', permission);
    return permission;
  } catch (error) {
    console.error('Lỗi khi yêu cầu quyền thông báo:', error);
    return 'denied';
  }
}

export async function subscribeUserToPush(username: string): Promise<boolean> {
  console.log('--- Bắt đầu quá trình đăng ký Push Notification ---');
  console.log('Username:', username);
  
  try {
    // Check basic support
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker không được hỗ trợ');
      return false;
    }

    if (!('PushManager' in window)) {
      console.error('Push Manager không được hỗ trợ');
      return false;
    }

    // Check VAPID key
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID Public Key không được cấu hình');
      return false;
    }
    
    console.log('VAPID Public Key được tải từ .env.local:', VAPID_PUBLIC_KEY);

    // Register service worker if not already registered
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker đã đăng ký thành công:', registration);
    } catch (swError) {
      console.error('Lỗi đăng ký Service Worker:', swError);
      // Try to get existing registration
      registration = await navigator.serviceWorker.ready;
      console.log('Sử dụng Service Worker có sẵn:', registration);
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker đã sẵn sàng');

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Đã có subscription, đang hủy subscription cũ...');
      await existingSubscription.unsubscribe();
    }

    // Convert VAPID key
    let applicationServerKey;
    try {
      applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      console.log('VAPID key đã được chuyển đổi thành công');
    } catch (keyError) {
      console.error('Lỗi chuyển đổi VAPID key:', keyError);
      return false;
    }

    // Subscribe to push notifications
    console.log('Đang tiến hành đăng ký mới với Push Service...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('Đăng ký Push Notification thành công:', subscription);

    // Save subscription to database
    console.log('Đang lưu subscription vào database...');
    const subscriptionData = subscription.toJSON();
    console.log('Subscription data:', subscriptionData);

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        username,
        subscription: subscriptionData as any
      }, {
        onConflict: 'username'
      });

    if (error) {
      console.error('Lỗi lưu push subscription vào database:', error);
      return false;
    }

    console.log('✅ Push subscription đã được lưu thành công vào database');
    
    // Test notification
    try {
      await registration.showNotification('Thông báo đẩy đã được bật!', {
        body: 'Bạn sẽ nhận được thông báo về tài sản đến hạn và các cập nhật quan trọng.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'test-notification'
      });
      console.log('✅ Test notification đã được gửi');
    } catch (testError) {
      console.warn('Không thể gửi test notification:', testError);
    }

    return true;
  } catch (error) {
    console.error('Lỗi khi đăng ký nhận thông báo đẩy:', error);
    
    // Provide more specific error messages
    if (error.name === 'AbortError') {
      console.error('Chi tiết lỗi: Push service từ chối đăng ký. Có thể do:');
      console.error('1. VAPID key không hợp lệ');
      console.error('2. Push service không khả dụng');
      console.error('3. Trình duyệt chặn push notifications');
    } else if (error.name === 'NotSupportedError') {
      console.error('Chi tiết lỗi: Push notifications không được hỗ trợ');
    } else if (error.name === 'NotAllowedError') {
      console.error('Chi tiết lỗi: Người dùng đã từ chối quyền thông báo');
    }
    
    return false;
  }
}

export async function unsubscribeFromPush(username: string): Promise<boolean> {
  console.log('--- Bắt đầu hủy đăng ký Push Notification ---');
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Đang hủy subscription...');
      await subscription.unsubscribe();
      console.log('Đã hủy subscription thành công');
    }

    // Remove subscription from database
    console.log('Đang xóa subscription khỏi database...');
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('username', username);

    if (error) {
      console.error('Lỗi xóa push subscription khỏi database:', error);
      return false;
    }

    console.log('✅ Đã hủy đăng ký Push Notification thành công');
    return true;
  } catch (error) {
    console.error('Lỗi khi hủy đăng ký push notifications:', error);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    console.log('VAPID key conversion successful, length:', outputArray.length);
    return outputArray;
  } catch (error) {
    console.error('Lỗi chuyển đổi VAPID key:', error);
    throw error;
  }
}

export function showNotification(title: string, options?: NotificationOptions): void {
  console.log('Đang hiển thị notification:', title);
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      });
      console.log('✅ Notification đã được hiển thị');
    } catch (error) {
      console.error('Lỗi hiển thị notification:', error);
    }
  } else {
    console.warn('Không thể hiển thị notification - quyền chưa được cấp');
  }
}

// Utility function to check push notification support
export function checkPushNotificationSupport(): {
  supported: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let supported = true;

  if (!('serviceWorker' in navigator)) {
    supported = false;
    reasons.push('Service Worker không được hỗ trợ');
  }

  if (!('PushManager' in window)) {
    supported = false;
    reasons.push('Push Manager không được hỗ trợ');
  }

  if (!('Notification' in window)) {
    supported = false;
    reasons.push('Notification API không được hỗ trợ');
  }

  if (!VAPID_PUBLIC_KEY) {
    supported = false;
    reasons.push('VAPID Public Key chưa được cấu hình');
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    supported = false;
    reasons.push('Push Notifications yêu cầu HTTPS');
  }

  return { supported, reasons };
}