import { supabase } from '@/integrations/supabase/client';
import { VAPID_PUBLIC_KEY } from '@/config';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Trình duyệt không hỗ trợ thông báo');
    return 'denied';
  }

  const currentPermission = Notification.permission;

  if (currentPermission === 'granted') {
    return 'granted';
  }

  if (currentPermission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Lỗi khi yêu cầu quyền thông báo:', error);
    return 'denied';
  }
}

export async function subscribeUserToPush(username: string): Promise<boolean> {
  try {
    // Check if we're in development environment
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // SILENT development mode - không hiện thông báo
      return await handleDevelopmentMode(username);
    }

    // Production environment - SILENT push notification setup
    return await setupProductionPushNotifications(username);
    
  } catch (error: unknown) {
    console.error('Lỗi khi đăng ký nhận thông báo đẩy:', error);
    
    // KHÔNG hiện fallback notification
    return false;
  }
}

async function handleDevelopmentMode(username: string): Promise<boolean> {
  try {
    // KHÔNG hiện thông báo development - chỉ setup silent
    
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
      return false;
    }

    return true;
  } catch (devError) {
    return false;
  }
}

async function setupProductionPushNotifications(username: string): Promise<boolean> {
  // Check basic support
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  if (!('PushManager' in window)) {
    throw new Error('Push Manager not supported');
  }

  // Check VAPID key
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VAPID key not configured');
  }

  // Validate VAPID key format
  if (!isValidVAPIDKey(VAPID_PUBLIC_KEY)) {
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
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    
  } catch (swError) {
    console.error('Lỗi đăng ký Service Worker:', swError);
    throw swError;
  }

  // Check if already subscribed and clean up
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    try {
      await existingSubscription.unsubscribe();
    } catch (unsubError) {
      console.warn('Không thể hủy subscription cũ:', unsubError);
    }
  }

  // Convert VAPID key
  let applicationServerKey: Uint8Array;
  try {
    applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  } catch (keyError) {
    console.error('Lỗi chuyển đổi VAPID key:', keyError);
    throw keyError;
  }

  // Subscribe to push notifications with retry logic
  let subscription: PushSubscription | null = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      break;
    } catch (subscribeError) {
      retryCount++;
      
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
  const subscriptionData = subscription.toJSON();

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

  // KHÔNG hiện test notification - setup hoàn tất silent
  console.log('✅ Push notifications setup completed silently');

  return true;
}

export async function unsubscribeFromPush(username: string): Promise<boolean> {
  try {
    // Try to unsubscribe from push service
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
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
    
    return outputArray;
  } catch (error) {
    console.error('Lỗi chuyển đổi VAPID key:', error);
    throw error;
  }
}

// CHỈ hiện notification khi có nội dung thật sự
export function showNotification(title: string, options?: NotificationOptions): void {
  // Kiểm tra nếu là thông báo setup - KHÔNG hiện
  if (title.includes('Push Notifications Enabled') || 
      title.includes('Notifications Enabled') ||
      title.includes('Development Mode') ||
      options?.body?.includes('Push notifications unavailable') ||
      options?.body?.includes('Notifications enabled for development')) {
    return; // Không hiện thông báo setup
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options
      });
    } catch (error) {
      console.error('Lỗi hiển thị notification:', error);
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
    const reason = 'Service Worker không được hỗ trợ';
    reasons.push(reason);
    console.warn(`[Push Support Check] Failed: ${reason}`);
  }

  if (!('PushManager' in window)) {
    supported = false;
    const reason = 'Push Manager không được hỗ trợ';
    reasons.push(reason);
    console.warn(`[Push Support Check] Failed: ${reason}`);
  }

  if (!('Notification' in window)) {
    supported = false;
    const reason = 'Notification API không được hỗ trợ';
    reasons.push(reason);
    console.warn(`[Push Support Check] Failed: ${reason}`);
  }

  if (!VAPID_PUBLIC_KEY) {
    supported = false;
    const reason = 'VAPID Public Key chưa được cấu hình';
    reasons.push(reason);
    console.warn(`[Push Support Check] Failed: ${reason}`);
  } else if (!isValidVAPIDKey(VAPID_PUBLIC_KEY)) {
    supported = false;
    const reason = 'VAPID Public Key không hợp lệ';
    reasons.push(reason);
    console.warn(`[Push Support Check] Failed: ${reason}`);
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    supported = false;
    const reason = 'Push Notifications yêu cầu HTTPS';
    reasons.push(reason);
    console.warn(`[Push Support Check] Failed: ${reason}`);
  }

  if (supported) {
    console.log('[Push Support Check] All checks passed.');
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
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        username,
        payload
      }
    });

    if (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }

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
    return false;
  }
}