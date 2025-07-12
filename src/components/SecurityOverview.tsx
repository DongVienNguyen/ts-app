import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Activity, Users, Lock, Clock, Shield, BarChart3, Settings } from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { SecurityFeaturesSummary } from './SecurityFeaturesSummary';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: number | string, icon: React.ReactNode, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-1/2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

export function SecurityOverview() {
  const { stats, isLoading, error } = useSecurityMonitoring();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không thể tải dữ liệu giám sát: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Sự kiện" value={stats.totalEvents} icon={<Activity className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
        <StatCard title="Đăng nhập" value={stats.loginAttempts} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
        <StatCard title="Đăng nhập thất bại" value={stats.failedLogins} icon={<Lock className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
        <StatCard title="Hoạt động đáng ngờ" value={stats.suspiciousActivity} icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sự kiện bảo mật gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : stats.recentEvents.length > 0 ? (
              <ul className="space-y-3">
                {stats.recentEvents.slice(0, 5).map((event) => (
                  <li key={event.id} className="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.type}</p>
                      <p className="text-sm text-gray-500 truncate">{event.username || 'Sự kiện hệ thống'}</p>
                    </div>
                    <div className="inline-flex items-center text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(event.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Không có sự kiện bảo mật nào gần đây.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Phân tích Bảo mật</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Sắp ra mắt</h3>
                  <p className="text-sm text-gray-500">Phân tích chi tiết sẽ có trong phiên bản sau.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cài đặt Bảo mật</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Sắp ra mắt</h3>
                  <p className="text-sm text-gray-500">Cài đặt nâng cao sẽ có trong phiên bản sau.</p>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

      <SecurityFeaturesSummary />
    </div>
  );
}