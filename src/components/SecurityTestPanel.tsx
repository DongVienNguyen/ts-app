import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, ShieldCheck, Activity, AlertCircle } from 'lucide-react';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { toast } from 'sonner';

export function SecurityTestPanel() {
  const { logEvent } = useRealTimeSecurityMonitoring();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [eventType, setEventType] = useState<string>('LOGIN_FAILED');

  const handleSimulateEvent = () => {
    if (!eventType) {
      toast.error('Vui lòng chọn loại sự kiện.');
      return;
    }

    logEvent(
      eventType,
      { message: message || `Simulated ${eventType} event.` },
      username || 'test_user' // Pass username as the third argument
    );
    toast.success(`Đã mô phỏng sự kiện: ${eventType}`);
  };

  const handleTestNotification = () => {
    toast.info('Đây là một thông báo kiểm tra từ hệ thống cảnh báo.', {
      description: 'Kiểm tra xem thông báo có hiển thị đúng không.',
      duration: 5000,
      icon: <AlertCircle className="h-4 w-4" />,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5" />
            <span>Mô phỏng Sự kiện Bảo mật</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Tên người dùng (tùy chọn)</Label>
              <Input
                id="username"
                placeholder="e.g., admin_test"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventType">Loại sự kiện</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOGIN_SUCCESS">Đăng nhập thành công</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Đăng nhập thất bại</SelectItem>
                  <SelectItem value="SUSPICIOUS_ACTIVITY">Hoạt động đáng ngờ</SelectItem>
                  <SelectItem value="ACCOUNT_LOCKED">Tài khoản bị khóa</SelectItem>
                  <SelectItem value="PASSWORD_RESET">Đặt lại mật khẩu</SelectItem>
                  <SelectItem value="RATE_LIMIT_EXCEEDED">Vượt quá giới hạn tốc độ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="message">Tin nhắn (tùy chọn)</Label>
            <Input
              id="message"
              placeholder="e.g., Sai mật khẩu"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button onClick={handleSimulateEvent} className="w-full">
            <Activity className="w-4 h-4 mr-2" />
            Mô phỏng Sự kiện
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Kiểm tra Hệ thống Cảnh báo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Nhấn nút bên dưới để kiểm tra xem hệ thống thông báo có hoạt động đúng không.
          </p>
          <Button onClick={handleTestNotification} className="w-full" variant="outline">
            <AlertCircle className="w-4 h-4 mr-2" />
            Gửi Thông báo Kiểm tra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}