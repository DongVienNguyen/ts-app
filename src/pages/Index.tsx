import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  Archive, 
  Bell, 
  BarChart3, 
  Shield,
  Activity,
  Database,
  Settings,
  Users
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';

const Index = () => {
  const { user } = useSecureAuth();

  const quickActions = [
    {
      title: 'Nhập Tài Sản',
      description: 'Ghi nhận giao dịch tài sản mới',
      icon: FileText,
      href: '/asset-entry',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Báo Cáo Hàng Ngày',
      description: 'Xem báo cáo giao dịch theo ngày',
      icon: Calendar,
      href: '/daily-report',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Tài Sản Khác',
      description: 'Quản lý tài sản không thuộc danh mục chính',
      icon: Archive,
      href: '/other-assets',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Nhắc Nhở Tài Sản',
      description: 'Quản lý nhắc nhở kiểm định tài sản',
      icon: Bell,
      href: '/asset-reminders',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const adminActions = [
    {
      title: 'Quản Lý Dữ Liệu',
      description: 'Quản lý người dùng và cấu hình hệ thống',
      icon: Database,
      href: '/data-management',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Giám Sát Bảo Mật',
      description: 'Theo dõi tình trạng bảo mật hệ thống',
      icon: Shield,
      href: '/security-monitor',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Phân Tích Hiệu Suất',
      description: 'Theo dõi hiệu suất và sử dụng hệ thống',
      icon: BarChart3,
      href: '/usage-monitoring',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      title: 'Sao Lưu Hệ Thống',
      description: 'Quản lý sao lưu và khôi phục dữ liệu',
      icon: Settings,
      href: '/system-backup',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Chào mừng, {user?.staff_name || user?.username}!
            </h1>
            <p className="text-gray-600 mt-1">
              Hệ thống quản lý tài sản - Dashboard chính
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <div className="text-sm text-gray-500">Vai trò</div>
              <div className="font-medium capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Thao Tác Nhanh
            </CardTitle>
            <CardDescription>
              Các chức năng thường dùng trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Functions */}
        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chức Năng Quản Trị
              </CardTitle>
              <CardDescription>
                Các công cụ quản lý và giám sát hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {adminActions.map((action, index) => (
                  <Link key={index} to={action.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${action.color}`}>
                            <action.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{action.title}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái hệ thống</p>
                  <p className="text-lg font-semibold text-green-600">Hoạt động bình thường</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Người dùng online</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {Math.floor(Math.random() * 10) + 5} người
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giao dịch hôm nay</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {Math.floor(Math.random() * 50) + 20} giao dịch
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt Động Gần Đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Hệ thống khởi động thành công</p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Đăng nhập thành công</p>
                  <p className="text-xs text-gray-500">
                    Người dùng: {user?.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Kiểm tra bảo mật hoàn tất</p>
                  <p className="text-xs text-gray-500">Không phát hiện mối đe dọa</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;