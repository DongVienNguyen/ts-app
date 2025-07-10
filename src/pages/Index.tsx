import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import { SecurityStatusWidget } from '@/components/SecurityStatusWidget';
import { SystemHealthWidget } from '@/components/SystemHealthWidget';
import Layout from '@/components/Layout';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useSecureAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.department === "NQ") {
          navigate('/daily-report');
        } else {
          navigate('/asset-entry');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Chào mừng, {user.staff_name || user.username}!</h1>
        <p className="text-muted-foreground">
          Vai trò: {user.role} | Phòng ban: {user.department}
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Security Status Widget (Admin only) */}
          {isAdmin(user) && <SecurityStatusWidget />}
          
          {/* System Health Widget (Admin only) */}
          {isAdmin(user) && <SystemHealthWidget />}
          
          <Card>
            <CardHeader>
              <CardTitle>Thông báo Mượn/Xuất</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Quản lý thông báo mượn và xuất tài sản</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách TS cần lấy</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Xem danh sách tài sản cần lấy hàng ngày</p>
            </CardContent>
          </Card>
          {isNqOrAdmin(user) && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Nhắc nhở Tài sản</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Quản lý nhắc nhở tài sản đến hạn</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Nhắc nhở CRC</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Quản lý nhắc nhở duyệt CRC</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Báo cáo Tài sản</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Xem báo cáo tài sản đã mượn</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tài sản Khác</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Quản lý tài sản, thùng khác gửi kho</p>
                </CardContent>
              </Card>
            </>
          )}
          {isAdmin(user) && (
            <Card>
              <CardHeader>
                <CardTitle>Quản lý Dữ liệu</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Quản lý dữ liệu hệ thống</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;