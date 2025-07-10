import { Users, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  recentFailedLogins: number;
  onlineUsers: number;
}

interface SystemOverviewCardsProps {
  stats: SecurityStats;
}

export function SystemOverviewCards({ stats }: SystemOverviewCardsProps) {
  const overviewItems = [
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      value: stats.totalUsers,
      label: 'Tổng người dùng',
      badge: `${stats.onlineUsers} online`
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      value: stats.activeUsers,
      label: 'Tài khoản hoạt động'
    },
    {
      icon: <Lock className="w-8 h-8 text-red-500" />,
      value: stats.lockedUsers,
      label: 'Tài khoản bị khóa'
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
      value: stats.recentFailedLogins,
      label: 'Thất bại 24h qua'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {overviewItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {item.icon}
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-sm text-gray-600">{item.label}</p>
                </div>
              </div>
              {item.badge && (
                <Badge variant="secondary">{item.badge}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}