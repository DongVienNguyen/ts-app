import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UsageOverview {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  totalPageViews: number;
  bounceRate: number;
  activeUsers: number;
}

interface DetailedStatsTabProps {
  overview: UsageOverview;
  formatDuration: (minutes: number) => string;
  isLoading: boolean;
}

export function DetailedStatsTab({ overview, formatDuration, isLoading }: DetailedStatsTabProps) {
  const sessionStats = [
    {
      label: 'Tổng số phiên:',
      value: overview.totalSessions.toLocaleString()
    },
    {
      label: 'Người dùng duy nhất:',
      value: overview.uniqueUsers.toLocaleString()
    },
    {
      label: 'Phiên/Người dùng:',
      value: overview.uniqueUsers > 0 ? (overview.totalSessions / overview.uniqueUsers).toFixed(1) : '0'
    }
  ];

  const timeStats = [
    {
      label: 'Thời gian TB/Phiên:',
      value: formatDuration(overview.averageSessionDuration)
    },
    {
      label: 'Trang/Phiên:',
      value: overview.totalSessions > 0 ? (overview.totalPageViews / overview.totalSessions).toFixed(1) : '0'
    },
    {
      label: 'Tỷ lệ thoát:',
      value: `${overview.bounceRate.toFixed(1)}%`
    }
  ];

  const activityStats = [
    {
      label: 'Đang hoạt động (24h):',
      value: overview.activeUsers.toLocaleString()
    },
    {
      label: 'Tổng lượt xem:',
      value: overview.totalPageViews.toLocaleString()
    }
  ];

  const statSections = [
    {
      title: 'Tổng quan Phiên',
      stats: sessionStats
    },
    {
      title: 'Thời gian Sử dụng',
      stats: timeStats
    },
    {
      title: 'Hoạt động Hiện tại',
      stats: activityStats
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê Chi tiết</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-2">
                <h4 className="font-medium text-gray-900">{section.title}</h4>
                <div className="space-y-1 text-sm">
                  {section.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="flex justify-between">
                      <span>{stat.label}</span>
                      <span className="font-medium">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}