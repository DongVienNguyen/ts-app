import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, TestTube, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { 
  requestNotificationPermission, 
  subscribeUserToPush, 
  unsubscribeFromPush,
  checkPushNotificationSupport,
  hasActivePushSubscription
} from '@/utils/pushNotificationUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PushNotificationTester = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [supportInfo, setSupportInfo] = useState<{supported: boolean; reasons: string[]}>({
    supported: false,
    reasons: []
  });
  const { user } = useAuth();

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user?.username) {
      setIsSubscribed(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const subscribed = await hasActivePushSubscription(user.username);
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      toast.error('Lỗi khi kiểm tra trạng thái đăng ký');
    } finally {
      setIsLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    setIsLoading(true);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    const support = checkPushNotificationSupport();
    setSupportInfo(support);
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        toast.success('✅ Quyền thông báo đã được cấp!');
      } else {
        toast.error('❌ Quyền thông báo bị từ chối');
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      toast.error('Lỗi khi yêu cầu quyền thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.username) {
      toast.error('Vui lòng đăng nhập để đăng ký thông báo');
      return;
    }

    setIsLoading(true);
    try {
      const success = await subscribeUserToPush(user.username);
      
      if (success) {
        setIsSubscribed(true);
        toast.success('🎉 Đã đăng ký thông báo đẩy thành công!');
      } else {
        toast.error('❌ Không thể đăng ký thông báo đẩy');
      }
    } catch (error) {
      console.error('❌ Error subscribing:', error);
      toast.error('Lỗi khi đăng ký thông báo đẩy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.username) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush(user.username);
      
      if (success) {
        setIsSubscribed(false);
        toast.success('✅ Đã hủy đăng ký thông báo đẩy');
      } else {
        toast.error('❌ Không thể hủy đăng ký');
      }
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
      toast.error('Lỗi khi hủy đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user?.username) {
      toast.error('Vui lòng đăng nhập để test thông báo');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          username: user.username,
          payload: {
            title: '🧪 Test Push Notification',
            body: 'Đây là thông báo test từ hệ thống quản lý tài sản!',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'test-notification',
            data: {
              url: '/',
              timestamp: new Date().toISOString()
            }
          }
        }
      });

      if (error) {
        toast.error('Lỗi khi gửi thông báo test: ' + error.message);
      } else {
        toast.success('🎉 Thông báo test đã được gửi!');
      }
    } catch (error) {
      toast.error('Lỗi khi test thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Đã cấp</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Chưa yêu cầu</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>🧪 Test Push Notifications</span>
          </div>
          <Button variant="ghost" size="icon" onClick={checkSubscriptionStatus} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Trạng thái hỗ trợ
          </h3>
          {supportInfo.supported ? (
            <div className="text-green-700">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Push Notifications được hỗ trợ ✅
            </div>
          ) : (
            <div className="text-red-700">
              <XCircle className="w-4 h-4 inline mr-2" />
              Push Notifications không được hỗ trợ:
              <ul className="list-disc list-inside mt-2 text-sm">
                {supportInfo.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Quyền thông báo:</h3>
            <p className="text-sm text-gray-600">Trạng thái quyền của trình duyệt</p>
          </div>
          {getPermissionBadge()}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Trạng thái đăng ký:</h3>
            <p className="text-sm text-gray-600">Đăng ký nhận thông báo đẩy</p>
          </div>
          {isLoading ? (
            <Badge className="bg-gray-100 text-gray-800">Đang kiểm tra...</Badge>
          ) : (
            <Badge className={isSubscribed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {isSubscribed ? (
                <><Bell className="w-3 h-3 mr-1" />Đã đăng ký</>
              ) : (
                <><BellOff className="w-3 h-3 mr-1" />Chưa đăng ký</>
              )}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {permission !== 'granted' && (
            <Button 
              onClick={handleRequestPermission}
              disabled={isLoading || !supportInfo.supported}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isLoading ? 'Đang yêu cầu...' : 'Yêu cầu quyền thông báo'}
            </Button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading || !user?.username}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký thông báo đẩy'}
            </Button>
          )}

          {isSubscribed && (
            <Button 
              onClick={handleUnsubscribe}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <BellOff className="w-4 h-4 mr-2" />
              {isLoading ? 'Đang hủy...' : 'Hủy đăng ký'}
            </Button>
          )}

          {isSubscribed && (
            <Button 
              onClick={handleTestNotification}
              disabled={isLoading}
              variant="outline"
              className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isLoading ? 'Đang gửi...' : 'Gửi thông báo test'}
            </Button>
          )}
        </div>

        {user?.username && (
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <strong>Người dùng:</strong> {user.username}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">📋 Hướng dẫn:</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Nhấn "Yêu cầu quyền thông báo" và cho phép</li>
            <li>Nhấn "Đăng ký thông báo đẩy" để đăng ký</li>
            <li>Nhấn "Gửi thông báo test" để kiểm tra</li>
            <li>Kiểm tra thông báo xuất hiện trên màn hình</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationTester;