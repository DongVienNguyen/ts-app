import { useState } from 'react';
import { Users, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { unlockAccount } from '@/services/secureAuthService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffAccount {
  id: string;
  username: string;
  staff_name: string;
  role: string;
  department: string;
  account_status: string;
  failed_login_attempts: number;
  last_failed_login: string | null;
  locked_at: string | null;
}

export function AccountManagementTab() {
  const [searchUsername, setSearchUsername] = useState('');
  const [accountInfo, setAccountInfo] = useState<StaffAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const searchAccount = async () => {
    if (!searchUsername.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .ilike('username', searchUsername.trim())
        .maybeSingle();

      if (error) {
        console.error('Error searching account:', error);
        toast.error('Lỗi tìm kiếm tài khoản');
        return;
      }

      if (!data) {
        toast.error('Không tìm thấy tài khoản');
        setAccountInfo(null);
        return;
      }

      setAccountInfo(data);
    } catch (error) {
      console.error('Search account error:', error);
      toast.error('Đã xảy ra lỗi khi tìm kiếm');
    }
    setIsLoading(false);
  };

  const handleUnlockAccount = async () => {
    if (!accountInfo) return;

    setIsUnlocking(true);
    try {
      const result = await unlockAccount(accountInfo.username);
      
      if (result.success) {
        toast.success('Mở khóa tài khoản thành công!');
        // Refresh account info
        await searchAccount();
      } else {
        toast.error(result.error || 'Không thể mở khóa tài khoản');
      }
    } catch (error) {
      console.error('Unlock account error:', error);
      toast.error('Đã xảy ra lỗi khi mở khóa tài khoản');
    }
    setIsUnlocking(false);
  };

  const getStatusBadge = (status: string, failedAttempts: number) => {
    if (status === 'locked') {
      return <Badge variant="destructive">Đã khóa</Badge>;
    }
    if (failedAttempts >= 3) {
      return <Badge variant="secondary">Cảnh báo ({failedAttempts} lần thất bại)</Badge>;
    }
    return <Badge variant="default">Hoạt động</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Quản lý tài khoản</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="searchUsername">Tên đăng nhập</Label>
              <Input
                id="searchUsername"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập để tìm kiếm"
                onKeyPress={(e) => e.key === 'Enter' && searchAccount()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={searchAccount}
                disabled={isLoading}
              >
                {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
              </Button>
            </div>
          </div>

          {accountInfo && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-3">Thông tin tài khoản</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Tên đăng nhập:</strong> {accountInfo.username}</p>
                  <p><strong>Họ tên:</strong> {accountInfo.staff_name || 'Chưa cập nhật'}</p>
                  <p><strong>Vai trò:</strong> {accountInfo.role}</p>
                  <p><strong>Phòng ban:</strong> {accountInfo.department || 'Chưa cập nhật'}</p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <strong>Trạng thái:</strong>
                    {getStatusBadge(accountInfo.account_status, accountInfo.failed_login_attempts)}
                  </div>
                  <p><strong>Lần thất bại:</strong> {accountInfo.failed_login_attempts || 0}</p>
                  {accountInfo.last_failed_login && (
                    <p><strong>Lần cuối thất bại:</strong> {new Date(accountInfo.last_failed_login).toLocaleString('vi-VN')}</p>
                  )}
                  {accountInfo.locked_at && (
                    <p><strong>Thời gian khóa:</strong> {new Date(accountInfo.locked_at).toLocaleString('vi-VN')}</p>
                  )}
                </div>
              </div>

              {accountInfo.account_status === 'locked' && (
                <div className="mt-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Tài khoản này đã bị khóa. Bạn có thể mở khóa để người dùng có thể đăng nhập lại.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleUnlockAccount}
                    disabled={isUnlocking}
                    className="mt-3"
                    variant="default"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    {isUnlocking ? 'Đang mở khóa...' : 'Mở khóa tài khoản'}
                  </Button>
                </div>
              )}

              {accountInfo.account_status === 'active' && accountInfo.failed_login_attempts >= 3 && (
                <div className="mt-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Tài khoản này có nhiều lần đăng nhập thất bại. Có thể cần reset số lần thất bại.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleUnlockAccount}
                    disabled={isUnlocking}
                    className="mt-3"
                    variant="outline"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isUnlocking ? 'Đang reset...' : 'Reset lần thất bại'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn quản lý tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p><strong>Mở khóa tài khoản:</strong> Sử dụng khi tài khoản bị khóa do nhập sai mật khẩu quá nhiều lần</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p><strong>Reset lần thất bại:</strong> Xóa số lần đăng nhập thất bại để tránh khóa tài khoản</p>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p><strong>Lưu ý:</strong> Tài khoản sẽ tự động mở khóa sau 24 giờ kể từ lần đăng nhập thất bại cuối cùng</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}