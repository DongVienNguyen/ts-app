import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton component

interface ErrorOverviewCardsProps {
  errorStats: {
    totalErrors: number;
    criticalErrors: number;
    resolvedErrors: number;
    errorRate: number;
  };
  isLoading: boolean;
  onCardClick?: (filterType: 'severity' | 'status', value: string) => void; // New prop for click handler
}

export function ErrorOverviewCards({ errorStats, isLoading, onCardClick }: ErrorOverviewCardsProps) {
  const cards = [
    {
      title: 'Tổng số lỗi',
      icon: AlertTriangle,
      value: isLoading ? <Skeleton className="h-6 w-24" /> : errorStats.totalErrors,
      description: 'Tổng số lỗi được ghi nhận trong 7 ngày qua',
      filter: null, // No specific filter for total errors
    },
    {
      title: 'Lỗi nghiêm trọng',
      icon: XCircle,
      value: isLoading ? <Skeleton className="h-6 w-20" /> : errorStats.criticalErrors,
      description: 'Số lỗi có mức độ nghiêm trọng "critical"',
      filter: { type: 'severity', value: 'critical' }, // Filter by severity
    },
    {
      title: 'Lỗi đã giải quyết',
      icon: CheckCircle,
      value: isLoading ? <Skeleton className="h-6 w-20" /> : errorStats.resolvedErrors,
      description: 'Số lỗi đã được đánh dấu là đã giải quyết',
      filter: { type: 'status', value: 'resolved' }, // Filter by status
    },
    {
      title: 'Tỷ lệ lỗi',
      icon: Activity,
      value: isLoading ? <Skeleton className="h-6 w-16" /> : `${errorStats.errorRate.toFixed(2)}/giờ`,
      description: 'Tỷ lệ lỗi trung bình trong 7 ngày qua',
      filter: null, // No specific filter for error rate
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={card.filter ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
          onClick={() => card.filter && onCardClick?.(card.filter.type as 'severity' | 'status', card.filter.value)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}