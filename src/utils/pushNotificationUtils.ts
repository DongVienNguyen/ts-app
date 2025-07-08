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
          return false;
        }

        console.log('✅ Development mode: Mock subscription saved');
        return true;
      } catch (devError) {
        console.error('Development fallback failed:', devError);
      }
    }

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
    
    console.log('VAPID Public Key:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');

    // Validate VAPID key format
    if (!isValidVAPIDKey(VAPID_PUBLIC_KEY)) {
      console.error('VAPID Public Key không hợp lệ - format không đúng');
      return false;
    }

    // Register service worker
    let registration: ServiceWorkerRegistration;
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service Worker đã đăng ký thành công:', registration);
      
      if (registration.installing) {
        await new Promise(resolve => {
          registration.installing!.addEventListener('statechange', () => {
            if (registration.installing!.state === 'activated') {
              resolve(true);
            }
          });
        });
      }
    } catch (swError) {
      console.error('Lỗi đăng ký Service Worker:', swError);
      try {
        registration = await navigator.serviceWorker.ready;
        console.log('Sử dụng Service Worker có sẵn:', registration);
      } catch (readyError) {
        console.error('Không thể lấy Service Worker ready:', readyError);
        return false;
      }
    }

    await navigator.serviceWorker.ready;
    console.log('Service Worker đã sẵn sàng');

    // Check if already subscribed
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
      return false;
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
          // If all retries failed, fall back to local notifications
          console.warn('❌ Push service registration failed. Falling back to local notifications only.');
          
          try {
            await showLocalNotification('Notifications Enabled (Local Only)', {
              body: 'Push notifications unavailable. You will receive local notifications when the app is open.',
              icon: '/icon-192x192.png'
            });
            
            // Save a local-only flag to database
            const localSubscription = {
              endpoint: `local-only-${username}-${Date.now()}`,
              keys: {
                p256dh: 'local-only',
                auth: 'local-only'
              }
            };

            const { error } = await supabase
              .from('push_subscriptions')
              .upsert({
                username,
                subscription: localSubscription as any
              }, {
                onConflict: 'username'
              });

            if (!error) {
              console.log('✅ Local-only notification mode enabled');
              return true;
            }
          } catch (fallbackError) {
            console.error('Fallback to local notifications failed:', fallbackError);
          }
          
          throw subscribeError;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!subscription) {
      console.error('Không thể tạo push subscription sau nhiều lần thử');
      return false;
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
      return false;
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
  } catch (error: unknown) {
    console.error('Lỗi khi đăng ký nhận thông báo đẩy:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Chi tiết lỗi AbortError: Push service từ chối đăng ký. Có thể do:');
        console.error('1. VAPID key không hợp lệ hoặc đã hết hạn');
        console.error('2. Push service không khả dụng (FCM/Mozilla)');
        console.error('3. Trình duyệt chặn push notifications');
        console.error('4. Service Worker chưa sẵn sàng');
        console.error('5. Development environment limitations (localhost)');
        
        // Try fallback to local notifications
        try {
          await showLocalNotification('Notifications Enabled (Limited)', {
            body: 'Push notifications unavailable. Local notifications will work when app is open.',
            icon: '/icon-192x192.png'
          });
          return true; // Return success for local notifications
        } catch (fallbackError) {
          console.error('Local notification fallback failed:', fallbackError);
        }
      }
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