import { useEffect, useRef } from 'react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { subscribeUserToPush, requestNotificationPermission } from '@/utils/pushNotificationUtils';

export const useAutoNotificationSetup = () => {
  const { user } = useSecureAuth();
  const hasSetupNotifications = useRef(false);
  const setupInProgress = useRef(false);

  useEffect(() => {
    // Chỉ setup 1 lần khi user login và chưa setup
    if (user && !hasSetupNotifications.current && !setupInProgress.current) {
      setupInProgress.current = true;
      setupNotifications();
    }
  }, [user]);

  const setupNotifications = async () => {
    try {
      // Kiểm tra xem đã setup chưa trong session này
      const sessionSetup = sessionStorage.getItem('notifications-setup');
      if (sessionSetup) {
        hasSetupNotifications.current = true;
        setupInProgress.current = false;
        return;
      }

      // Request permission SILENT - không hiện thông báo
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted' && user?.username) {
        // Subscribe user SILENT - không hiện thông báo
        const success = await subscribeUserToPush(user.username);
        
        if (success) {
          // Đánh dấu đã setup trong session
          sessionStorage.setItem('notifications-setup', 'true');
          hasSetupNotifications.current = true;
          console.log('✅ Notifications setup completed silently');
        }
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    } finally {
      setupInProgress.current = false;
    }
  };

  return {
    isSetup: hasSetupNotifications.current
  };
};