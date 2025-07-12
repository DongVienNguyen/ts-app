import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Users, Clock, Shield, BarChart3, Wifi } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

export function RealTimeSecurityDashboard() {
  const { activeUsers, recentEvents, threatTrends, isLoading, error } = useRealTimeSecurityMonitoring();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Không thể tải dữ liệu giám sát thời gian thực: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Người dùng đang hoạt động" value={activeUsers} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
        <StatCard title="Sự kiện gần đây" value={recentEvents.length} icon={<Activity className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
        <StatCard title="Trạng thái kết nối" value="Đang hoạt động" icon={<Wifi className="h-4 w-4 text-green-500" />} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dòng hoạt động trực tiếp</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentEvents.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {recentEvents.map((event) => (
                  <li key={event.id} className="flex items-center space-x-3 rounded-md border p-3 transition-colors hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.type}</p>
                      <p className="text-xs text-gray-500 truncate">{event.username || 'Hệ thống'} - {event.ip}</p>
                    </div>
                    <div className="inline-flex items-center text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(event.timestamp).toLocaleTimeString('vi-VN')}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Xu hướng mối đe dọa thời gian thực</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : threatTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={threatTrends}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="successfulLogins" stroke="#82ca9d" name="Đăng nhập thành công" />
                  <Line type="monotone" dataKey="failedLogins" stroke="#8884d8" name="Đăng nhập thất bại" />
                  <Line type="monotone" dataKey="suspiciousActivities" stroke="#ffc658" name="Hoạt động đáng ngờ" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Không có đủ dữ liệu để hiển thị xu hướng mối đe dọa.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}