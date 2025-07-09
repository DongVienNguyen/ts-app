import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, TestTube, Settings, CheckCircle, AlertCircle, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { performEmailTest } from '@/services/emailTestService';
import { useSecureAuth } from '@/contexts/AuthContext';
import { EmailTestButton } from '@/components/EmailTestButton';

export const AdminEmailSettings = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [showCurrentEmail, setShowCurrentEmail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { user } = useSecureAuth();

  useEffect(() => {
    loadAdminEmail();
  }, []);

  const loadAdminEmail = async () => {
    setIsLoadingEmail(true);
    try {
      // Fix: Use proper Supabase query syntax
      const { data, error } = await supabase
        .from('staff')
        .select('email, staff_name')
        .eq('role', 'admin')
        .limit(1);

      console.log('Admin email query result:', { data, error });

      if (error) {
        console.error('Error loading admin email:', error);
        setMessage({ type: 'error', text: `Lỗi tải email admin: ${error.message}` });
        return;
      }

      if (data && data.length > 0 && data[0].email) {
        setCurrentAdminEmail(data[0].email);
        setAdminEmail(data[0].email);
        console.log('Admin email loaded:', data[0].email);
      } else {
        console.log('No admin email found');
        setCurrentAdminEmail('');
        setAdminEmail('');
      }
    } catch (error: any) {
      console.error('Exception loading admin email:', error);
      setMessage({ type: 'error', text: `Lỗi hệ thống: ${error.message}` });
    } finally {
      setIsLoadingEmail(false);
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
      // Fix: Update admin user's email properly
      const { data: adminUsers, error: findError } = await supabase
        .from('staff')
        .select('id, username, staff_name')
        .eq('role', 'admin')
        .limit(1);

      if (findError) {
        throw findError;
      }

      if (!adminUsers || adminUsers.length === 0) {
        setMessage({ type: 'error', text: 'Không tìm thấy tài khoản admin' });
        return;
      }

      const { error: updateError } = await supabase
        .from('staff')
        .update({ email: adminEmail.trim() })
        .eq('id', adminUsers[0].id);

      if (updateError) {
        throw updateError;
      }

      setCurrentAdminEmail(adminEmail.trim());
      setMessage({ type: 'success', text: 'Đã lưu email admin thành công' });
      
      console.log('Admin email saved successfully:', adminEmail.trim());
    } catch (error: any) {
      console.error('Error saving admin email:', error);
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

    if (!currentAdminEmail) {
      setMessage({ type: 'error', text: 'Vui lòng lưu email admin trước khi test' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🧪 Starting email test for user:', user.username);
      console.log('📧 Admin email:', currentAdminEmail);
      
      const result = await performEmailTest(user.username);
      
      console.log('📧 Email test result:', result);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Test email thành công! Email đã được gửi đến: ${currentAdminEmail}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ Test email thất bại: ${result.error || 'Lỗi không xác định'}` 
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);
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
      {/* Current Admin Email Display */}
      {!isLoadingEmail && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <User className="w-5 h-5" />
              <span>Email Admin hiện tại</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-sm">
                  {currentAdminEmail ? (
                    showCurrentEmail ? currentAdminEmail : '••••••••@••••••.com'
                  ) : (
                    <span className="text-gray-500 italic">Chưa có email admin</span>
                  )}
                </span>
              </div>
              {currentAdminEmail && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCurrentEmail(!showCurrentEmail)}
                >
                  {showCurrentEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              )}
            </div>
            {currentAdminEmail && (
              <p className="text-xs text-blue-600 mt-2">
                ✅ Email admin đã được cấu hình và sẵn sàng nhận thông báo
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Cài đặt Email Admin</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingEmail ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Đang tải email admin...</span>
            </div>
          ) : (
            <>
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
                    disabled={isLoading || adminEmail === currentAdminEmail}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {isLoading ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </div>
                {adminEmail !== currentAdminEmail && adminEmail && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Email đã thay đổi. Nhấn "Lưu" để cập nhật.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📧 Thông tin</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Email này sẽ nhận tất cả thông báo từ hệ thống</li>
                  <li>• Bao gồm: báo cáo lỗi, thông báo tài sản, nhắc nhở CRC</li>
                  <li>• Đảm bảo email luôn hoạt động để không bỏ lỡ thông báo quan trọng</li>
                  <li>• Email sẽ được gửi qua dịch vụ Resend API</li>
                </ul>
              </div>
            </>
          )}
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
              {currentAdminEmail && (
                <p className="text-xs text-green-600 mt-1">
                  📧 Email test sẽ được gửi đến: {showCurrentEmail ? currentAdminEmail : '••••••••@••••••.com'}
                </p>
              )}
            </div>
            <Button 
              onClick={testEmailFunction}
              disabled={isTesting || !currentAdminEmail}
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

          {/* Direct Email Test */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-purple-800 mb-2">🔧 Test Email Trực tiếp</h4>
            <EmailTestButton />
          </div>

          {!currentAdminEmail && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vui lòng lưu email admin trước khi thực hiện test email.
              </AlertDescription>
            </Alert>
          )}
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