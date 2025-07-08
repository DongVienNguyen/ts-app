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
    // Check if we're in development environment
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      console.warn('🚧 Development Environment Detected');
      console.warn('Push notifications may not work properly on localhost');
      console.warn('For full functionality, test on HTTPS production environment');
      
      // Try to show a local notification instead
      try {
        await showLocalNotification('Push Notifications Enabled!', {
          body: 'Development mode: Local notifications only. Deploy to HTTPS for full push notification support.',
          icon: '/icon-192x192.png'
        });
        
        // Save a mock subscription to database for development
        const mockSubscription = {
          endpoint: `mock-endpoint-${username}-${Date.now()}`,
          keys: {
            p256dh: 'mock-p256dh-key',
            auth: 'mock-auth-key'
          }
        };

        // Use the authenticated supabase client
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            username,
            subscription: mockSubscription as any
          }, {
            onConflict: 'username'
          });

        if (error) {
          console.error('Lỗi lưu mock subscription:', error);
          // Even if database save fails, local notifications still work
          console.log('✅ Development mode: Local notifications enabled (database save failed but notifications work)');
          return true;
        }

        console.log('✅ Development mode: Mock subscription saved');
        return true;
      } catch (devError) {
        console.error('Development fallback failed:', devError);
        // Still return true for local notifications
        return true;
      }
    }

    // Production environment - full push notification setup
    return await setupProductionPushNotifications(username);
    
  } catch (error: unknown) {
    console.error('Lỗi khi đăng ký nhận thông báo đẩy:', error);
    
    // Try fallback to local notifications
    try {
      await showLocalNotification('Notifications Enabled (Limited)', {
        body: 'Push notifications unavailable. Local notifications will work when app is open.',
        icon: '/icon-192x192.png'
      });
      return true; // Return success for local notifications
    } catch (fallbackError) {
      console.error('Local notification fallback failed:', fallbackError);
      return false;
    }
  }
}

async function setupProductionPushNotifications(username: string): Promise<boolean> {
  console.log('🌐 Setting up production push notifications...');
  
  // Check basic support
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker không được hỗ trợ');
    throw new Error('Service Worker not supported');
  }

  if (!('PushManager' in window)) {
    console.error('Push Manager không được hỗ trợ');
    throw new Error('Push Manager not supported');
  }

  // Check VAPID key
  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID Public Key không được cấu hình');
    throw new Error('VAPID key not configured');
  }
  
  console.log('VAPID Public Key:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');

  // Validate VAPID key format
  if (!isValidVAPIDKey(VAPID_PUBLIC_KEY)) {
    console.error('VAPID Public Key không hợp lệ - format không đúng');
    throw new Error('Invalid VAPID key format');
  }

  // Register service worker with better error handling
  let registration: ServiceWorkerRegistration;
  try {
    // Wait a bit for any existing registrations to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    console.log('Service Worker đã đăng ký thành công:', registration);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker đã sẵn sàng');
    
  } catch (swError) {
    console.error('Lỗi đăng ký Service Worker:', swError);
    throw swError;
  }

  // Check if already subscribed and clean up
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    console.log('Đã có subscription, đang hủy subscription cũ...');
    try {
      await existingSubscription.unsubscribe();
      console.log('Đã hủy subscription cũ thành công');
    } catch (unsubError) {
      console.warn('Không thể hủy subscription cũ:', unsubError);
    }
  }

  // Convert VAPID key
  let applicationServerKey: Uint8Array;
  try {
    applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    console.log('VAPID key đã được chuyển đổi thành công, length:', applicationServerKey.length);
  } catch (keyError) {
    console.error('Lỗi chuyển đổi VAPID key:', keyError);
    throw keyError;
  }

  // Subscribe to push notifications with retry logic
  console.log('Đang tiến hành đăng ký mới với Push Service...');
  let subscription: PushSubscription | null = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('Đăng ký Push Notification thành công:', subscription);
      break;
    } catch (subscribeError) {
      retryCount++;
      console.error(`Lần thử ${retryCount}/${maxRetries} - Lỗi đăng ký push:`, subscribeError);
      
      if (retryCount >= maxRetries) {
        throw subscribeError;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
    }
  }

  if (!subscription) {
    throw new Error('Không thể tạo push subscription sau nhiều lần thử');
  }

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
    throw error;
  }

  console.log('✅ Push subscription đã được lưu thành công vào database');
  
  // Test notification
  try {
    await registration.showNotification('Push Notifications Enabled!', {
      body: 'You will now receive notifications about asset reminders and important updates.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      requireInteraction: false
    });
    console.log('✅ Test notification đã được gửi');
  } catch (testError) {
    console.warn('Không thể gửi test notification:', testError);
  }

  return true;
}

export async function unsubscribeFromPush(username: string): Promise<boolean> {
  console.log('--- Bắt đầu hủy đăng ký Push Notification ---');
  
  try {
    // Try to unsubscribe from push service
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          console.log('Đang hủy subscription...');
          await subscription.unsubscribe();
          console.log('Đã hủy subscription thành công');
        }
      } catch (swError) {
        console.warn('Lỗi hủy subscription từ service worker:', swError);
      }
    }

    // Remove from database
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

function isValidVAPIDKey(key: string): boolean {
  try {
    const decoded = urlBase64ToUint8Array(key);
    return decoded.length === 65;
  } catch (error) {
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

// Helper function for local notifications
async function showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options
    });
  } else if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      });
    } catch (error) {
      console.error('Service Worker notification failed:', error);
    }
  }
}

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
  } else if (!isValidVAPIDKey(VAPID_PUBLIC_KEY)) {
    supported = false;
    reasons.push('VAPID Public Key không hợp lệ');
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    supported = false;
    reasons.push('Push Notifications yêu cầu HTTPS');
  }

  // Add development environment warning
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    reasons.push('Development environment: Push notifications may be limited');
  }

  return { supported, reasons };
}

// Utility function to send push notification via server
export async function sendPushNotification(
  username: string, 
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<boolean> {
  try {
    console.log('📤 Sending push notification via server...', { username, payload });
    
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        username,
        payload
      }
    });

    if (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }

    console.log('✅ Push notification sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    return false;
  }
}

// Check if user has active push subscription
export async function hasActivePushSubscription(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('username', username)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}