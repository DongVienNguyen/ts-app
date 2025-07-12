import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Activity, AlertCircle, UserCog } from 'lucide-react';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';

export function SecurityActionsPanel() {
  const { user } = useSecureAuth();
  const { logEvent } = useRealTimeSecurityMonitoring(user);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [eventType, setEventType] = useState<string>('ACCOUNT_LOCKED');

  const handlePerformAction = async () => {
    if (!eventType) {
      toast.error('Vui lòng chọn loại sự kiện hoặc hành động.');
      return;
    }

    if (eventType === 'ACCOUNT_LOCKED' || eventType === 'ACCOUNT_UNLOCKED') {
      if (!username) {
        toast.error('Vui lòng nhập tên người dùng để khóa/mở khóa.');
        return;
      }
      const status = eventType === 'ACCOUNT_LOCKED' ? 'locked' : 'active';
      const actionText = status === 'locked' ? 'khóa' : 'mở khóa';

      toast.promise(
        supabase.functions.invoke('manage-user-status', {
          body: { username, status },
        }),
        {
          loading: `Đang ${actionText} tài khoản ${username}...`,
          success: `Tài khoản ${username} đã được ${actionText} thành công.`,
          error: (err) => `Lỗi ${actionText} tài khoản: ${err.message}`,
        }
      );
    } else {
      // Giữ lại logic mô phỏng cho các sự kiện khác
      logEvent(
        eventType,
        { message: message || `Simulated ${eventType} event.` },
        username || 'test_user'
      );
      toast.success(`Đã mô phỏng sự kiện: ${eventType}`);
    }
  };

  const handleTestNotification = () => {
    toast.info('Đây là một thông báo kiểm tra từ hệ thống cảnh báo.', {
      description: 'Kiểm tra xem thông báo có hiển thị đúng không.',
      duration: 5000,
      icon: <AlertCircle className="h-4 w-4" />,
    });
  };

  const handleDirectLogTest = () => {
    if (!eventType) {
      toast.error('Vui lòng chọn loại sự kiện hoặc hành động.');
      return;
    }

    // Always call logEvent directly for this test button
    // The username is optional for logEvent, so we can pass a default if not provided
    logEvent(
      eventType,
      { message: message || `Simulated ${eventType} event.` },
      username || 'test_user'
    );
    toast.success(`Đã mô phỏng sự kiện: ${eventType}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCog className="w-5 h-5" />
            <span>Bảng điều khiển Tác vụ Bảo mật</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Tên người dùng</Label>
              <Input
                id="username"
                placeholder="e.g., user_to_manage"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventType">Hành động / Loại sự kiện</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hành động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCOUNT_LOCKED">Khóa tài khoản</SelectItem>
                  <SelectItem value="ACCOUNT_UNLOCKED">Mở khóa tài khoản</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Mô phỏng: Đăng nhập thành công</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Mô phỏng: Đăng nhập thất bại</SelectItem>
                  <SelectItem value="SUSPICIOUS_ACTIVITY">Mô phỏng: Hoạt động đáng ngờ</SelectItem>
                  <SelectItem value="PASSWORD_RESET">Mô phỏng: Đặt lại mật khẩu</SelectItem>
                  <SelectItem value="RATE_LIMIT_EXCEEDED">Mô phỏng: Vượt quá giới hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="message">Tin nhắn (cho sự kiện mô phỏng)</Label>
            <Input
              id="message"
              placeholder="e.g., Sai mật khẩu"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={eventType === 'ACCOUNT_LOCKED' || eventType === 'ACCOUNT_UNLOCKED'}
            />
          </div>
          <Button onClick={handlePerformAction} className="w-full">
            <Activity className="w-4 h-4 mr-2" />
            Thực hiện
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
          {/* New button for direct log test */}
          <Button onClick={handleDirectLogTest} className="w-full mt-2" variant="secondary">
            <Activity className="w-4 h-4 mr-2" />
            Gửi Sự kiện Bảo mật Trực tiếp (Test)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}