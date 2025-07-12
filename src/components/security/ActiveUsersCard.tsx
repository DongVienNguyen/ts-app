import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ActiveUsersCardProps {
  activeUsers: number;
  isLoading: boolean;
}

export function ActiveUsersCard({ activeUsers, isLoading }: ActiveUsersCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Người dùng đang hoạt động (15 phút qua)</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{activeUsers}</div>
        )}
        <p className="text-xs text-muted-foreground">
          Số người dùng có hoạt động trên hệ thống.
        </p>
      </CardContent>
    </Card>
  );
}