import { Users, Clock, MousePointer, Eye, TrendingUp, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface UsageOverview {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  totalPageViews: number;
  bounceRate: number;
  activeUsers: number;
}

interface UsageOverviewCardsProps {
  overview: UsageOverview;
  formatDuration: (minutes: number) => string;
}

export function UsageOverviewCards({ overview, formatDuration }: UsageOverviewCardsProps) {
  const cards = [
    {
      title: 'Tổng phiên',
      value: overview.totalSessions,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'text-blue-500'
    },
    {
      title: 'Người dùng duy nhất',
      value: overview.uniqueUsers,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'text-green-500'
    },
    {
      title: 'Thời gian TB',
      value: formatDuration(overview.averageSessionDuration),
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'text-purple-500'
    },
    {
      title: 'Lượt xem trang',
      value: overview.totalPageViews,
      icon: MousePointer,
      color: 'text-orange-600',
      bgColor: 'text-orange-500'
    },
    {
      title: 'Tỷ lệ thoát',
      value: `${overview.bounceRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'text-red-500'
    },
    {
      title: 'Đang hoạt động',
      value: overview.activeUsers,
      icon: Globe,
      color: 'text-indigo-600',
      bgColor: 'text-indigo-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  <p className="text-sm text-gray-600">{card.title}</p>
                </div>
                <Icon className={`w-8 h-8 ${card.bgColor}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}