import { useState } from 'react';
import { Bell, X, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useSecureAuth } from '@/contexts/AuthContext';
import { requestNotificationPermission, subscribeUserToPush } from '@/utils/pushNotificationUtils';
import { useAutoNotificationSetup } from '@/hooks/useAutoNotificationSetup';

export function NotificationPermissionPrompt() {
  const { user } = useSecureAuth();
  const { showManualPrompt, setShowManualPrompt } = useAutoNotificationSetup();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEnableNotifications = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        await subscribeUserToPush(user.username);
        setShowManualPrompt(false);
        
        // Show success notification
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification('🎉 Thông báo đã được bật!', {
            body: 'Bạn sẽ nhận được thông báo về tài sản đến hạn và cập nhật quan trọng.',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'success-notification',
            requireInteraction: false
          });
        }
      } else {
        handleDismiss();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      handleDismiss();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-permission-dismissed', 'true');
    setShowManualPrompt(false);
  };

  if (!showManualPrompt || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-white p-4 rounded-lg shadow-xl border-2 border-blue-200 animate-slide-in-up">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
          <Bell className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">🔔 Bật thông báo đẩy</p>
          <p className="text-sm text-gray-600 mt-1">
            Nhận thông báo về tài sản đến hạn và các cập nhật quan trọng ngay trên thiết bị của bạn.
          </p>
          
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-800">
                <strong>Lợi ích:</strong> Không bỏ lỡ thông báo quan trọng, nhận cảnh báo kịp thời
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-3">
            <Button 
              onClick={handleEnableNotifications} 
              size="sm" 
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang bật...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Bật thông báo
                </>
              )}
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              Để sau
            </Button>
          </div>
          
          {Notification.permission === 'denied' && (
            <div className="mt-2 p-2 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-xs text-orange-800">
                  Thông báo đã bị chặn. Vui lòng bật trong cài đặt trình duyệt.
                </p>
              </div>
            </div>
          )}
        </div>
        <Button onClick={handleDismiss} variant="ghost" size="icon" className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}