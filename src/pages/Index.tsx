import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, isNqOrAdmin } from '@/utils/permissions';
import { 
  Package, 
  FileText, 
  Bell, 
  Database,
  BarChart3,
  Users,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: 'Thông báo Mượn/Xuất Tài sản',
      description: 'Ghi nhận các giao dịch mượn và xuất tài sản',
      icon: Package,
      color: 'bg-green-500',
      href: '/asset-entry',
      show: true,
      buttonText: 'Bắt đầu ghi nhận',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Danh sách TS cần lấy',
      description: 'Theo dõi danh sách tài sản cần lấy theo từng ca và phòng ban.',
      icon: FileText,
      color: 'bg-blue-500',
      href: '/daily-report',
      show: true,
      buttonText: 'Xem báo cáo',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Nhắc tài sản',
      description: 'Quản lý và gửi nhắc nhở tài sản đến hạn trả',
      icon: Bell,
      color: 'bg-orange-500',
      href: '/asset-reminders',
      show: isNqOrAdmin(user),
      buttonText: 'Xem nhắc nhở',
      buttonColor: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'Nhắc nhở CRC',
      description: 'Quản lý nhắc nhở duyệt CRC',
      icon: Bell,
      color: 'bg-purple-500',
      href: '/crc-reminders',
      show: isNqOrAdmin(user),
      buttonText: 'Xem CRC',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Tài sản Khác',
      description: 'Quản lý tài sản, thùng khác gửi kho',
      icon: Package,
      color: 'bg-indigo-500',
      href: '/other-assets',
      show: isNqOrAdmin(user),
      buttonText: 'Quản lý',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700'
    }
  ];

  const visibleActions = quickActions.filter(action => action.show);

  // Mock statistics - in real app, these would come from API
  const stats = [
    {
      title: 'Tổng giao dịch',
      value: '1,234',
      description: 'Giao dịch trong tháng',
      icon: BarChart3,
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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào mừng, {user.staff_name || user.username}!
        </h1>
        <p className="text-gray-600">
          Hôm nay là {new Date().toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleActions.map((action, index) => (
          <Card key={index} className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {action.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-4">
                {action.description}
              </p>
              <Button
                onClick={() => navigate(action.href)}
                className={`w-full ${action.buttonColor} text-white`}
              >
                {action.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Panel Access */}
      {isAdmin(user) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Database className="w-6 h-6" />
              <span>Quản trị hệ thống</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              Truy cập các công cụ quản trị và giám sát hệ thống
            </p>
            <Button
              onClick={() => navigate('/data-management')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Mở bảng điều khiển
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;