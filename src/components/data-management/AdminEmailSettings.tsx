import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, TestTube, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { performEmailTest } from '@/services/emailTestService';
import { useSecureAuth } from '@/contexts/AuthContext';

export const AdminEmailSettings = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useSecureAuth();

  useEffect(() => {
    loadAdminEmail();
  }, []);

  const loadAdminEmail = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('email')
        .eq('role', 'admin')
        .single();

      if (data && data.email) {
        setAdminEmail(data.email);
      }
    } catch (error) {
      console.warn('Could not load admin email:', error);
    }
  };

  const saveAdminEmail = async () => {
    if (!adminEmail.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập email admin' });
      return;
    }

    if (!adminEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Email không hợp lệ' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('staff')
        .update({ email: adminEmail.trim() })
        .eq('role', 'admin');

      if (error) throw error;

      setMessage({ type: 'success', text: 'Đã lưu email admin thành công' });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Lỗi lưu email: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const testEmailFunction = async () => {
    if (!user?.username) {
      setMessage({ type: 'error', text: 'Không tìm thấy thông tin người dùng' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await performEmailTest(user.username);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: '✅ Test email thành công! Kiểm tra hộp thư của bạn.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ Test email thất bại: ${result.error || 'Lỗi không xác định'}` 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `❌ Lỗi test email: ${error.message || 'Lỗi không xác định'}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Cài đặt Email Admin</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="adminEmail">Email Admin nhận thông báo hệ thống</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@company.com"
                className="flex-1"
              />
              <Button 
                onClick={saveAdminEmail}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📧 Thông tin</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Email này sẽ nhận tất cả thông báo từ hệ thống</li>
              <li>• Bao gồm: báo cáo lỗi, thông báo tài sản, nhắc nhở CRC</li>
              <li>• Đảm bảo email luôn hoạt động để không bỏ lỡ thông báo quan trọng</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Email Test Function */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5 text-green-600" />
            <span>Kiểm tra chức năng Email</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Test gửi email toàn hệ thống</h3>
              <p className="text-sm text-gray-600 mt-1">
                Kiểm tra chức năng gửi email ở tất cả các trang và module
              </p>
            </div>
            <Button 
              onClick={testEmailFunction}
              disabled={isTesting}
              className="bg-green-600 hover:bg-green-700"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTesting ? 'Đang test...' : 'Test Email'}
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🧪 Test bao gồm</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Thông báo mượn/xuất tài sản</li>
              <li>• Nhắc nhở tài sản đến hạn</li>
              <li>• Nhắc nhở duyệt CRC</li>
              <li>• Báo cáo lỗi hệ thống</li>
              <li>• Xác nhận giao dịch</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Message Display */}
      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
               className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};