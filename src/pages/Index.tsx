import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSecureAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import { SecurityStatusWidget } from '@/components/SecurityStatusWidget';
import { SystemHealthWidget } from '@/components/SystemHealthWidget';
import { Package, Users, AlertTriangle, TrendingUp } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useSecureAuth();

  // Remove automatic redirect - let user stay on dashboard
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
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

  const stats = [
    {
      title: 'Tổng giao dịch',
      value: '1,234',
      description: 'Giao dịch trong tháng',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Người dùng hoạt động',
      value: '89',
      description: 'Người dùng trong tuần',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Cảnh báo',
      value: '12',
      description: 'Cần xử lý',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      title: 'Hiệu suất',
      value: '98.5%',
      description: 'Uptime hệ thống',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Chào mừng, {user?.staff_name || user?.username}!
        </h1>
        <p className="text-green-100">
          Hệ thống quản lý tài sản - {user?.department} ({user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'})
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Widgets */}
      {isAdmin(user) && (
        <div className="grid gap-4 md:grid-cols-2">
          <SecurityStatusWidget />
          <SystemHealthWidget />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Thông báo Mượn/Xuất Tài sản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Ghi nhận các giao dịch mượn và xuất tài sản
            </p>
            <a 
              href="/asset-entry" 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Bắt đầu ghi nhận
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Danh sách TS cần lấy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Theo dõi danh sách tài sản cần lấy theo từng ca và phòng ban.
            </p>
            <a 
              href="/daily-report" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Xem báo cáo
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Additional sections for NQ and Admin users */}
      {isNqOrAdmin(user) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nhắc nhở Tài sản</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Quản lý nhắc nhở tài sản đến hạn
              </p>
              <a 
                href="/asset-reminders" 
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Xem nhắc nhở
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nhắc nhở CRC</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Quản lý nhắc nhở duyệt CRC
              </p>
              <a 
                href="/crc-reminders" 
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Xem CRC
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tài sản Khác</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Quản lý tài sản, thùng khác gửi kho
              </p>
              <a 
                href="/other-assets" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Quản lý
              </a>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Hoạt động</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Service</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Hoạt động</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Push Notifications</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-600">Hạn chế</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;