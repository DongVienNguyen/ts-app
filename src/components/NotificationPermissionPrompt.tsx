import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { BellRing, X } from 'lucide-react';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { toast } from 'sonner';

export function NotificationPermissionPrompt() {
  const { user } = useSecureAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const dismissed = localStorage.getItem(`notificationPromptDismissed_${user.username}`);
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    };

    const timer = setTimeout(checkPermission, 5000); // Show after 5 seconds
    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await subscribeUserToPush(user.username);
      toast.success('Đã bật thông báo đẩy thành công!');
    } else {
      toast.warning('Bạn đã không cấp quyền nhận thông báo.');
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    if (!user) return;
    localStorage.setItem(`notificationPromptDismissed_${user.username}`, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 bg-background p-4 rounded-lg shadow-lg border flex items-start space-x-4 max-w-sm animate-slide-in-up">
      <div className="flex-shrink-0 pt-1">
        <BellRing className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="font-semibold">Bật thông báo</p>
        <p className="text-sm text-muted-foreground">Nhận thông báo quan trọng ngay cả khi ứng dụng đã đóng.</p>
        <div className="flex space-x-2 mt-3">
            <Button onClick={handleEnable} size="sm">Bật ngay</Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">Để sau</Button>
        </div>
      </div>
       <Button onClick={handleDismiss} variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}