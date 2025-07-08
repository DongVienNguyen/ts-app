import { useState } from 'react';
    import { Button } from '@/components/ui/button';
    import { useSecureAuth } from '@/contexts/AuthContext';
    import { sendPushNotification } from '@/services/notificationService';
    import { toast } from 'sonner';
    import { Loader2 } from 'lucide-react';

    export function PushNotificationTester() {
      const { user } = useSecureAuth();
      const [isLoading, setIsLoading] = useState(false);

      const handleTestPush = async () => {
        if (!user) {
          toast.error('Bạn phải đăng nhập để kiểm tra thông báo đẩy.');
          return;
        }

        setIsLoading(true);
        toast.info('Đang gửi thông báo đẩy thử nghiệm...');

        try {
          const result = await sendPushNotification(user.username, {
            title: 'Thông báo thử nghiệm 🚀',
            body: `Đây là thông báo đẩy được gửi tới ${user.staff_name || user.username}.`,
            url: window.location.origin,
          });

          if (result.success) {
            toast.success('Yêu cầu gửi thông báo đẩy đã được thực hiện. Vui lòng kiểm tra thông báo của bạn (có thể mất vài giây).');
            console.log('Push notification invocation result:', result.data);
          } else {
            toast.error(`Gửi thông báo đẩy thất bại: ${result.error || 'Lỗi không xác định'}`);
          }
        } catch (error) {
          console.error('Error sending test push notification:', error);
          toast.error('Đã xảy ra lỗi khi gửi thông báo đẩy.');
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="p-4 border rounded-lg my-4 bg-card text-card-foreground">
          <h3 className="font-semibold mb-2">Kiểm tra Thông báo Đẩy (Web Push)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Nhấn nút bên dưới để gửi một thông báo đẩy thử nghiệm đến chính thiết bị này.
            Lưu ý: Bạn phải cấp quyền nhận thông báo cho trang web này trong trình duyệt trước.
          </p>
          <Button onClick={handleTestPush} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi thông báo thử nghiệm
          </Button>
        </div>
      );
    }