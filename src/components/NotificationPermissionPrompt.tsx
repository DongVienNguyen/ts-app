import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import { useSecureAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';

export function NotificationPermissionPrompt() {
  const { user } = useSecureAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we should show the notification prompt
    const checkNotificationPermission = () => {
      if (!user || !('Notification' in window)) return;

      const dismissed = localStorage.getItem('notification-permission-dismissed');
      const permission = Notification.permission;

      if (permission === 'default' && !dismissed) {
        // Show prompt after 5 seconds
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);

        return () => clearTimeout(timer);
      }
    };

    checkNotificationPermission();
  }, [user]);

  const handleEnableNotifications = async () => {
    if (!user) return;

    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await subscribeUserToPush(user.username);
      setShowPrompt(false);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-permission-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-background p-4 rounded-lg shadow-lg border animate-slide-in-up">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Bật thông báo</p>
          <p className="text-sm text-muted-foreground">
            Nhận thông báo về tài sản đến hạn và các cập nhật quan trọng.
          </p>
          <div className="flex space-x-2 mt-3">
            <Button onClick={handleEnableNotifications} size="sm">
              Bật thông báo
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Để sau
            </Button>
          </div>
        </div>
        <Button onClick={handleDismiss} variant="ghost" size="icon" className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}