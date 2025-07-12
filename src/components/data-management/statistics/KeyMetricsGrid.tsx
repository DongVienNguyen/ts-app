import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Users, Tag, Home, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import type { KeyMetrics } from '@/hooks/useStatisticsData';

interface KeyMetricsGridProps {
  metrics: KeyMetrics | null;
  isLoading: boolean;
  comparisonEnabled: boolean;
}

const MetricChange = ({ value }: { value: number | undefined }) => {
  if (value === undefined || !isFinite(value)) {
    return <p className="text-xs text-muted-foreground">Không có dữ liệu kỳ trước để so sánh</p>;
  }
  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-muted-foreground';
  const Icon = isPositive ? ArrowUp : ArrowDown;

  return (
    <p className={`text-xs flex items-center font-medium ${color}`}>
      {isPositive || isNegative ? <Icon className="h-3 w-3 mr-1" /> : null}
      {value.toFixed(1)}% so với kỳ trước
    </p>
  );
};

const MetricCard = ({ title, value, icon: Icon, change, isLoading, comparisonEnabled, subtext }: { title: string, value: string | number, icon: React.ElementType, change?: number, isLoading: boolean, comparisonEnabled: boolean, subtext: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold truncate" title={String(value)}>{isLoading ? '...' : value}</div>
      {comparisonEnabled && change !== undefined ? <MetricChange value={change} /> : <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
  </Card>
);

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ metrics, isLoading, comparisonEnabled }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <MetricCard title="Tổng giao dịch" value={metrics?.totalTransactions ?? 0} icon={Activity} change={metrics?.totalTransactionsChange} isLoading={isLoading} comparisonEnabled={comparisonEnabled} subtext="trong kỳ đã chọn" />
      <MetricCard title="Nhân viên hoạt động" value={metrics?.activeStaff ?? 0} icon={Users} change={metrics?.activeStaffChange} isLoading={isLoading} comparisonEnabled={comparisonEnabled} subtext="trong kỳ đã chọn" />
      <MetricCard title="Loại GD phổ biến" value={metrics?.mostFrequentType ?? 'N/A'} icon={Tag} isLoading={isLoading} comparisonEnabled={false} subtext="phổ biến nhất trong kỳ" />
      <MetricCard title="Phòng hoạt động nhất" value={metrics?.mostActiveRoom ?? 'N/A'} icon={Home} isLoading={isLoading} comparisonEnabled={false} subtext="sôi nổi nhất trong kỳ" />
      <MetricCard title="Ca hoạt động nhất" value={metrics?.mostActivePartsDay ?? 'N/A'} icon={Clock} isLoading={isLoading} comparisonEnabled={false} subtext="sôi nổi nhất trong kỳ" />
    </div>
  );
};