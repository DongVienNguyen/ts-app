import { AlertTriangle, XCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
}

interface ErrorOverviewCardsProps {
  errorStats: ErrorStats;
}

export function ErrorOverviewCards({ errorStats }: ErrorOverviewCardsProps) {
  const cards = [
    {
      title: 'Tổng số lỗi',
      value: errorStats.totalErrors,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'text-red-500'
    },
    {
      title: 'Lỗi nghiêm trọng',
      value: errorStats.criticalErrors,
      icon: XCircle,
      color: 'text-orange-600',
      bgColor: 'text-orange-500'
    },
    {
      title: 'Đã giải quyết',
      value: errorStats.resolvedErrors,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'text-green-500'
    },
    {
      title: 'Lỗi/giờ (24h)',
      value: errorStats.errorRate.toFixed(1),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'text-blue-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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