import React from 'react';
import {
  PerformanceHeader,
  PerformanceScoreCard,
  PerformanceCharts,
  ResourceUsageCharts,
  UserActivityChart,
  PerformanceAnalysis,
} from '@/components/system-health/performance';
import { PerformanceMetric, PerformanceInsights, TimeRange } from '@/components/system-health/performance/types';
import { SystemHealth } from '@/components/system-health/types';
import { Skeleton } from '@/components/ui/skeleton';

interface PerformanceTabProps {
  metrics: PerformanceMetric[];
  insights: PerformanceInsights;
  health: SystemHealth | null;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onExportData: () => void;
  isLoading: boolean;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  metrics,
  insights,
  health,
  timeRange,
  onTimeRangeChange,
  onExportData,
  isLoading,
}) => {
  if (isLoading || !health) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PerformanceHeader
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        onExportData={onExportData}
      />
      <PerformanceScoreCard insights={insights} />
      <PerformanceCharts metrics={metrics} />
      <ResourceUsageCharts metrics={metrics} health={health} />
      <UserActivityChart metrics={metrics} />
      <PerformanceAnalysis metrics={metrics} insights={insights} />
    </div>
  );
};