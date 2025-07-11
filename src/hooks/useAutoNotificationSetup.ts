import { useEffect, useState } from 'react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';

export function useAutoNotificationSetup() {
  const { user } = useSecureAuth();
  const [showManualPrompt, setShowManualPrompt] = useState(false);

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

        // Try auto-request permission after user interaction
        let autoRequestAttempted = false;
        
        const attemptAutoRequest = async () => {
          if (autoRequestAttempted) return;
          autoRequestAttempted = true;
          
          try {
            console.log('🔔 Attempting auto-request notification permission...');
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
            } else {
              // Auto request failed, show manual prompt
              console.log('🔔 Auto request failed, showing manual prompt');
              setShowManualPrompt(true);
            }
          } catch (error) {
            console.log('🔔 Auto request failed, showing manual prompt');
            setShowManualPrompt(true);
          }
        };

        // Try auto-request on first user interaction
        const handleFirstInteraction = () => {
          attemptAutoRequest();
          // Remove listeners after first attempt
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        };

        // Wait for user interaction before auto-requesting
        document.addEventListener('click', handleFirstInteraction, { once: true });
        document.addEventListener('touchstart', handleFirstInteraction, { once: true });
        document.addEventListener('keydown', handleFirstInteraction, { once: true });

        // Fallback: show manual prompt after 30 seconds if no interaction
        const fallbackTimer = setTimeout(() => {
          if (!autoRequestAttempted) {
            console.log('🔔 No user interaction, showing manual prompt');
            setShowManualPrompt(true);
          }
        }, 30000);

        return () => {
          clearTimeout(fallbackTimer);
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        };
      } catch (error) {
        console.error('❌ Notification setup error:', error);
        setShowManualPrompt(true);
      }
    };

    setupNotifications();
  }, [user]);

  return { showManualPrompt, setShowManualPrompt };
}