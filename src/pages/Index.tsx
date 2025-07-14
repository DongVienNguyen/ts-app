import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Bell, 
  Shield,
  Activity,
  Database,
  Settings,
  Users,
  List,
  ShieldCheck,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { UnresolvedErrorsBanner } from '@/components/UnresolvedErrorsBanner';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { RealtimeActivityFeed } from '@/components/RealtimeActivityFeed';
import { useRealtimeActivity } from '@/hooks/useRealtimeActivity';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user } = useSecureAuth();
  const { stats, systemStatusInfo, isLoading } = useDashboardStats();
  const { activities, isLoading: isActivityLoading, refetch: refetchActivities } = useRealtimeActivity(5);

  const quickActions = [
    {
      title: 'Thông báo Mượn/Xuất',
      icon: FileText,
      href: '/asset-entry',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Danh sách TS cần lấy',
      icon: List,
      href: '/daily-report',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Nhắc tài sản đến hạn',
      icon: Bell,
      href: '/asset-reminders',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Nhắc duyệt CRC',
      icon: ShieldCheck,
      href: '/crc-reminders',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const adminActions = [
    {
      title: 'Quản lý dữ liệu',
      icon: Database,
      href: '/data-management',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Giám sát Bảo mật',
      icon: Shield,
      href: '/security-monitor',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Giám sát Hệ thống',
      icon: Activity,
      href: '/error-monitoring',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      title: 'System Backup',
      icon: Settings,
      href: '/system-backup',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const ActionCard = ({ action }: { action: { title: string, icon: React.ElementType, href: string, color: string } }) => {
    const IconComponent = action.icon; // Rename to a capitalized variable
    return (
      <Link to={action.href}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${action.color}`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">{action.title}</h3>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, isLoading }: { title: string, value: string | number, icon: React.ElementType, color: string, isLoading: boolean }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {user?.role === 'admin' && <UnresolvedErrorsBanner />}

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Thao Tác Nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <ActionCard key={index} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>

        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chức Năng Quản Trị
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {adminActions.map((action, index) => (
                  <ActionCard key={index} action={action} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${systemStatusInfo.iconBg}`}>
                  <Activity className={`h-6 w-6 ${systemStatusInfo.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái hệ thống</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-40 mt-1" />
                  ) : (
                    <p className={`text-lg font-semibold ${systemStatusInfo.color}`}>{systemStatusInfo.text}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <StatCard 
            title="Người dùng online" 
            value={`${stats.onlineUsers} người`} 
            icon={Users} 
            color="bg-blue-500" 
            isLoading={isLoading} 
          />
          <StatCard 
            title="Giao dịch hôm nay" 
            value={`${stats.transactionsToday} GD`} 
            icon={BarChart3} 
            color="bg-purple-500" 
            isLoading={isLoading} 
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hoạt Động Gần Đây</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchActivities()}>
              <RefreshCw className={`h-4 w-4 ${isActivityLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <RealtimeActivityFeed activities={activities} isLoading={isActivityLoading} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;