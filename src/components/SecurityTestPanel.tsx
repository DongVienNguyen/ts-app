import { useState } from 'react';
import { Shield, TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { checkAccountStatus, resetPassword } from '@/services/secureAuthService';
import { useSecureAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function SecurityTestPanel() {
  const { user } = useSecureAuth();
  const [testUsername, setTestUsername] = useState('');
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isResetting, setIsResetting] = useState(false);

  const testAccountStatus = async () => {
    if (!testUsername.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập');
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkAccountStatus(testUsername);
      setAccountStatus(result);
      
      if (result.error) {
        toast.error(`Lỗi kiểm tra: ${result.error}`);
      } else {
        toast.success('Kiểm tra trạng thái thành công');
      }
    } catch (error) {
      console.error('Account status check error:', error);
      toast.error('Đã xảy ra lỗi khi kiểm tra trạng thái');
    }
    setIsChecking(false);
  };

  const testPasswordReset = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để test reset password');
      return;
    }

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      toast.error('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetPassword(user.username, passwordData.current, passwordData.new);
      
      if (result.success) {
        toast.success('Test reset password thành công!');
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        toast.error(`Test thất bại: ${result.error}`);
      }
    } catch (error) {
      console.error('Password reset test error:', error);
      toast.error('Đã xảy ra lỗi khi test reset password');
    }
    setIsResetting(false);
  };

  const getStatusBadge = (status: any) => {
    if (!status) return null;

    if (status.isLocked) {
      return <Badge variant="destructive">Tài khoản bị khóa</Badge>;
    }
    
    if (status.failedAttempts >= 3) {
      return <Badge variant="secondary">Cảnh báo ({status.failedAttempts} lần thất bại)</Badge>;
    }
    
    return <Badge variant="default">Tài khoản hoạt động</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <TestTube className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Test Security Features</h2>
      </div>

      {/* Account Status Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Test Account Status Check</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="testUsername">Tên đăng nhập</Label>
              <Input
                id="testUsername"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập để kiểm tra"
                onKeyPress={(e) => e.key === 'Enter' && testAccountStatus()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={testAccountStatus}
                disabled={isChecking}
              >
                {isChecking ? 'Đang kiểm tra...' : 'Kiểm tra'}
              </Button>
            </div>
          </div>

          {accountStatus && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-2">Kết quả kiểm tra:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span>Trạng thái:</span>
                  {getStatusBadge(accountStatus)}
                </div>
                <p><strong>Số lần thất bại:</strong> {accountStatus.failedAttempts}</p>
                {accountStatus.canRetryAt && (
                  <p><strong>Có thể thử lại lúc:</strong> {new Date(accountStatus.canRetryAt).toLocaleString('vi-VN')}</p>
                )}
                {accountStatus.error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{accountStatus.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Reset Test */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Test Password Reset</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Đang test với tài khoản: <strong>{user.username}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            <Button 
              onClick={testPasswordReset}
              disabled={isResetting}
              className="w-full"
            >
              {isResetting ? 'Đang test...' : 'Test Reset Password'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Account Status Check</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Password Reset Function</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Account Lockout Protection</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Admin Account Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Rate Limiting</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Security Logging</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}