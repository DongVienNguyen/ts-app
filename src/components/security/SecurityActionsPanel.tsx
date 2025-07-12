import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Activity, AlertCircle, UserCog, TestTube, Zap } from 'lucide-react';
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
  const [isTestingRealtime, setIsTestingRealtime] = useState(false);
  const [isTestingDirect, setIsTestingDirect] = useState(false);

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

  const handleTestRealtime = async () => {
    setIsTestingRealtime(true);
    try {
      console.log('🧪 [TEST] Testing real-time functionality via Edge Function...');
      
      // Test Edge Function directly
      const { data, error } = await supabase.functions.invoke('log-security-event', {
        body: {
          eventType: 'TEST_REALTIME',
          data: { 
            message: 'Test real-time functionality via Edge Function',
            timestamp: new Date().toISOString(),
            testId: Math.random().toString(36).substr(2, 9)
          },
          username: user?.username || 'test_admin',
          userAgent: navigator.userAgent,
          ipAddress: null,
        },
      });

      if (error) {
        console.error('❌ [TEST] Edge Function error:', error);
        toast.error(`Lỗi Edge Function: ${error.message}`);
      } else {
        console.log('✅ [TEST] Edge Function success:', data);
        toast.success('Edge Function hoạt động! Kiểm tra Dòng Hoạt động Trực tiếp.');
      }
    } catch (error) {
      console.error('❌ [TEST] Test failed:', error);
      toast.error('Test thất bại. Kiểm tra console để biết chi tiết.');
    } finally {
      setIsTestingRealtime(false);
    }
  };

  const handleTestDirectInsert = async () => {
    setIsTestingDirect(true);
    try {
      console.log('🧪 [TEST] Testing direct database insert...');
      
      // Insert directly into database
      const { data, error } = await supabase
        .from('security_events')
        .insert({
          event_type: 'TEST_REALTIME',
          username: user?.username || 'test_admin',
          event_data: {
            message: 'Test real-time functionality via direct insert',
            timestamp: new Date().toISOString(),
            testId: Math.random().toString(36).substr(2, 9)
          },
          user_agent: navigator.userAgent,
          ip_address: '127.0.0.1'
        })
        .select();

      if (error) {
        console.error('❌ [TEST] Direct insert error:', error);
        toast.error(`Lỗi direct insert: ${error.message}`);
      } else {
        console.log('✅ [TEST] Direct insert success:', data);
        toast.success('Direct insert thành công! Kiểm tra Dòng Hoạt động Trực tiếp.');
      }
    } catch (error) {
      console.error('❌ [TEST] Direct insert failed:', error);
      toast.error('Direct insert thất bại. Kiểm tra console để biết chi tiết.');
    } finally {
      setIsTestingDirect(false);
    }
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
            <TestTube className="w-5 h-5" />
            <span>Kiểm tra Real-time</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Nhấn các nút bên dưới để kiểm tra xem real-time có hoạt động không.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleTestRealtime} 
              variant="outline"
              disabled={isTestingRealtime}
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTestingRealtime ? 'Đang test Edge Function...' : 'Test Edge Function'}
            </Button>
            
            <Button 
              onClick={handleTestDirectInsert} 
              variant="outline"
              disabled={isTestingDirect}
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isTestingDirect ? 'Đang test Direct Insert...' : 'Test Direct Insert'}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>• <strong>Edge Function:</strong> Test qua Supabase Edge Function</div>
            <div>• <strong>Direct Insert:</strong> Test trực tiếp vào database</div>
          </div>
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
            <AlertCircle className="w-4 w-4 mr-2" />
            Gửi Thông báo Kiểm tra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}