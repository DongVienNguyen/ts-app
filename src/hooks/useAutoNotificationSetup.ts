import { useEffect } from 'react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';

export function useAutoNotificationSetup() {
  const { user } = useSecureAuth();

  useEffect(() => {
    if (!user) return;

    const setupNotifications = async () => {
      try {
        // Check if notifications are supported
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
          console.log('🔔 Push notifications not supported');
          return;
        }

        // Check current permission
        const currentPermission = Notification.permission;
        
        // If already granted, ensure subscription is active
        if (currentPermission === 'granted') {
          console.log('🔔 Notifications already granted, checking subscription...');
          await subscribeUserToPush(user.username);
          return;
        }

        // If denied, don't ask again
        if (currentPermission === 'denied') {
          console.log('🔔 Notifications denied by user');
          return;
        }

        // Auto-request permission after user has been active for 30 seconds
        const timer = setTimeout(async () => {
          try {
            console.log('🔔 Auto-requesting notification permission...');
            const permission = await requestNotificationPermission();
            
            if (permission === 'granted') {
              console.log('✅ Notification permission granted automatically');
              await subscribeUserToPush(user.username);
              
              // Show welcome notification
              if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification('TS Manager', {
                  body: 'Thông báo đã được bật! Bạn sẽ nhận được cập nhật quan trọng.',
                  icon: '/icon-192x192.png',
                  badge: '/icon-192x192.png',
                  tag: 'welcome-notification',
                  requireInteraction: false
                });
              }
            }
          } catch (error) {
            console.error('❌ Auto notification setup failed:', error);
          }
        }, 30000); // 30 seconds delay

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('❌ Notification setup error:', error);
      }
    };

    setupNotifications();
  }, [user]);
}