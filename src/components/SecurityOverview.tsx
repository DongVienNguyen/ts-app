import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Activity, Users, Lock } from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { SecurityFeaturesSummary } from './SecurityFeaturesSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { ThreatAnalysisCard } from './security/ThreatAnalysisCard';
import { UserRoleSummaryCard } from './security/UserRoleSummaryCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

const getEventTypeVariant = (eventType: string) => {
  if (eventType.includes('SUCCESS')) return 'default';
  if (eventType.includes('FAIL')) return 'destructive';
  if (eventType.includes('SUSPICIOUS') || eventType.includes('RATE_LIMIT')) return 'destructive';
  return 'secondary';
};

export function SecurityOverview() {
  const { stats, isLoading, error, getEventTrends } = useSecurityMonitoring();
  const threatData = getEventTrends();

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
        <StatCard title="Sự kiện (7 ngày)" value={stats.totalEvents} icon={<Activity className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
        <StatCard title="Lượt đăng nhập" value={stats.loginAttempts} icon={<Users className="h-4 w-4 text-muted-foreground" />} isLoading={isLoading} />
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
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : stats.recentEvents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại sự kiện</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Địa chỉ IP</TableHead>
                    <TableHead className="text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentEvents.slice(0, 7).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge variant={getEventTypeVariant(event.event_type)}>{event.event_type}</Badge>
                      </TableCell>
                      <TableCell>{event.username || 'Hệ thống'}</TableCell>
                      <TableCell>{event.ip || 'N/A'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Không có sự kiện bảo mật nào gần đây.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
            <UserRoleSummaryCard />
            <ThreatAnalysisCard threatTrends={threatData} isLoading={isLoading} />
        </div>
      </div>

      <SecurityFeaturesSummary />
    </div>
  );
}