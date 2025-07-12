import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityEvent } from '@/hooks/useRealTimeSecurityMonitoring';

interface ActiveUsersCardProps {
  activeUsers: number;
  recentEvents: SecurityEvent[];
  isLoading: boolean;
}

export function ActiveUsersCard({ activeUsers, recentEvents, isLoading }: ActiveUsersCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Người dùng đang hoạt động</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{activeUsers}</div>
        )}
        <p className="text-xs text-muted-foreground">
          Người dùng hiện đang hoạt động trên hệ thống
        </p>
      </CardContent>
    </Card>
  );
}