import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, XCircle, AlertTriangle, Smartphone, Settings } from 'lucide-react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { 
  requestNotificationPermission, 
  subscribeUserToPush, 
  unsubscribeFromPush,
  checkPushNotificationSupport 
} from '@/utils/pushNotificationUtils';
import { supabase } from '@/integrations/supabase/client';

export function PushNotificationTester() {
  const { user } = useSecureAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [supportInfo, setSupportInfo] = useState<{ supported: boolean; reasons: string[] }>({ supported: true, reasons: [] });

  useEffect(() => {
    // Check support
    const support = checkPushNotificationSupport();
    setSupportInfo(support);

    // Check current permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Check if already subscribed
    checkSubscriptionStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user?.username) return;

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('username', user.username)
        .single();

      if (!error && data) {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.log('No existing subscription found');
      setIsSubscribed(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        setMessage({ type: 'success', text: 'Quyền thông báo đã được cấp thành công!' });
      } else if (permission === 'denied') {
        setMessage({ type: 'error', text: 'Quyền thông báo đã bị từ chối. Vui lòng bật thủ công trong cài đặt trình duyệt.' });
      } else {
        setMessage({ type: 'info', text: 'Quyền thông báo chưa được quyết định.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi yêu cầu quyền thông báo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.username) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập để đăng ký thông báo.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const success = await subscribeUserToPush(user.username);
      
      if (success) {
        setIsSubscribed(true);
        setMessage({ type: 'success', text: 'Đăng ký thông báo đẩy thành công! Bạn sẽ nhận được thông báo về tài sản đến hạn.' });
      } else {
        setMessage({ type: 'error', text: 'Không thể đăng ký thông báo đẩy. Vui lòng kiểm tra console để biết chi tiết.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi đăng ký thông báo đẩy.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.username) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const success = await unsubscribeFromPush(user.username);
      
      if (success) {
        setIsSubscribed(false);
        setMessage({ type: 'success', text: 'Đã hủy đăng ký thông báo đẩy thành công.' });
      } else {
        setMessage({ type: 'error', text: 'Không thể hủy đăng ký thông báo đẩy.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi hủy đăng ký thông báo đẩy.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user?.username) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          username: user.username,
          payload: {
            title: '🧪 Test Notification',
            body: 'Đây là thông báo test từ hệ thống quản lý tài sản!',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'test-notification',
            data: {
              url: '/',
              type: 'test'
            }
          }
        }
      });

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Đã gửi thông báo test thành công! Kiểm tra thông báo trên thiết bị của bạn.' });
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      setMessage({ type: 'error', text: `Lỗi gửi thông báo test: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Đã cấp</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Chưa quyết định</Badge>;
    }
  };

  const getSubscriptionBadge = () => {
    if (isSubscribed) {
      return <Badge className="bg-blue-100 text-blue-800"><Bell className="w-3 h-3 mr-1" />Đã đăng ký</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800"><Bell className="w-3 h-3 mr-1" />Chưa đăng ký</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-6 h-6" />
            <span>Push Notification Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Support Status */}
          <div>
            <h3 className="font-semibold mb-3">Trạng thái hỗ trợ</h3>
            <div className="space-y-2">
              {supportInfo.supported ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Push Notifications được hỗ trợ</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700">Push Notifications không được hỗ trợ</span>
                  </div>
                  <ul className="ml-6 text-sm text-red-600">
                    {supportInfo.reasons.map((reason, index) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div>
            <h3 className="font-semibold mb-3">Trạng thái hiện tại</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Quyền thông báo:</span>
                {getPermissionBadge()}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>Trạng thái đăng ký:</span>
                {getSubscriptionBadge()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="font-semibold mb-3">Hành động</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={handleRequestPermission}
                disabled={isLoading || notificationPermission === 'granted'}
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                Yêu cầu quyền
              </Button>

              <Button
                onClick={handleSubscribe}
                disabled={isLoading || notificationPermission !== 'granted' || isSubscribed}
                className="bg-green-600 hover:bg-green-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Đăng ký
              </Button>

              <Button
                onClick={handleUnsubscribe}
                disabled={isLoading || !isSubscribed}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Hủy đăng ký
              </Button>

              <Button
                onClick={handleTestNotification}
                disabled={isLoading || !isSubscribed}
                variant="outline"
              >
                <Bell className="w-4 h-4 mr-2" />
                Test thông báo
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
                  className={message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
                            message.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Hướng dẫn sử dụng:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Nhấn "Yêu cầu quyền" để xin quyền thông báo từ trình duyệt</li>
              <li>2. Nhấn "Đăng ký" để đăng ký nhận thông báo đẩy</li>
              <li>3. Nhấn "Test thông báo" để kiểm tra thông báo hoạt động</li>
              <li>4. Bạn sẽ nhận được thông báo ngay cả khi đóng trình duyệt</li>
            </ol>
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-50 border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">Debug Information</summary>
              <div className="mt-2 text-sm space-y-1">
                <div>User: {user?.username || 'Not logged in'}</div>
                <div>Permission: {notificationPermission}</div>
                <div>Subscribed: {isSubscribed ? 'Yes' : 'No'}</div>
                <div>Support: {supportInfo.supported ? 'Yes' : 'No'}</div>
                <div>HTTPS: {window.location.protocol === 'https:' ? 'Yes' : 'No'}</div>
                <div>Service Worker: {'serviceWorker' in navigator ? 'Supported' : 'Not supported'}</div>
                <div>Push Manager: {'PushManager' in window ? 'Supported' : 'Not supported'}</div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}