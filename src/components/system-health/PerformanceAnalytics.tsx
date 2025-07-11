import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemHealth } from './types';
import {
  PerformanceHeader,
  PerformanceScoreCard,
  PerformanceCharts,
  ResourceUsageCharts,
  UserActivityChart,
  PerformanceAnalysis,
  usePerformanceAnalytics,
  TimeRange
} from './performance';

interface PerformanceAnalyticsProps {
  health: SystemHealth;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  health,
  timeRange,
  onTimeRangeChange
}) => {
  const {
    metrics,
    insights,
    isLoading,
    exportData,
    refreshData
  } = usePerformanceAnalytics(health, timeRange);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <PerformanceHeader
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        onExportData={exportData}
      />

      {/* Performance Score Overview */}
      <PerformanceScoreCard insights={insights} />

      {/* Charts Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceCharts metrics={metrics} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <ResourceUsageCharts metrics={metrics} health={health} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserActivityChart metrics={metrics} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <PerformanceAnalysis metrics={metrics} insights={insights} />
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading performance data...</span>
        </div>
      )}
    </div>
  );
};