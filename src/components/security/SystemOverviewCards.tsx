import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, Database, Clock, Server } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemOverviewCardsProps {
  systemStatus: {
    apiConnected: boolean;
    apiResponseTime: number;
    dbConnected: boolean;
    dbResponseTime: number;
  };
  activeUsers: number;
  isLoading: boolean;
}

export function SystemOverviewCards({ systemStatus, activeUsers, isLoading }: SystemOverviewCardsProps) {
  const statusItems = [
    {
      title: 'Trạng thái API',
      value: systemStatus.apiConnected ? 'Đang hoạt động' : 'Mất kết nối',
      icon: <Wifi className="h-4 w-4 text-muted-foreground" />,
      color: systemStatus.apiConnected ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Thời gian phản hồi API',
      value: isLoading ? '...' : `${systemStatus.apiResponseTime}ms`,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      color: systemStatus.apiResponseTime < 100 ? 'text-green-600' : 'text-orange-600',
    },
    {
      title: 'Trạng thái DB',
      value: systemStatus.dbConnected ? 'Đang hoạt động' : 'Mất kết nối',
      icon: <Database className="h-4 w-4 text-muted-foreground" />,
      color: systemStatus.dbConnected ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Thời gian phản hồi DB',
      value: isLoading ? '...' : `${systemStatus.dbResponseTime}ms`,
      icon: <Server className="h-4 w-4 text-muted-foreground" />,
      color: systemStatus.dbResponseTime < 80 ? 'text-green-600' : 'text-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statusItems.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-3/4" />
            ) : (
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}