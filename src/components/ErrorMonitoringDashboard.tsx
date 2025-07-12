import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorOverviewCards } from '@/components/error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from '@/components/error-monitoring/ErrorListTab';
import { ErrorAnalyticsTab } from '@/components/error-monitoring/ErrorAnalyticsTab';
import { PerformanceTab } from '@/components/error-monitoring/PerformanceTab';
import { ServiceStatusTab } from '@/components/error-monitoring/ServiceStatusTab';
import { ResourcesTab } from '@/components/error-monitoring/ResourcesTab';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { RealTimeStatusIndicator } from '@/components/error-monitoring/RealTimeStatusIndicator';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';
import { SystemAlertsDisplay } from '@/components/error-monitoring/SystemAlertsDisplay';

// Import necessary types for props
import { SystemError, SystemMetric, SystemAlert } from '@/utils/errorTracking';
import { ServiceHealth } from '@/components/error-monitoring/ServiceStatusTab';
import { SystemHealth } from '@/components/system-health/types';
import { PerformanceMetric, PerformanceInsights, TimeRange } from '@/components/system-health/performance/types';

// Define the props interface for ErrorMonitoringDashboard
interface ErrorMonitoringDashboardProps {
  errorStats: any;
  recentErrors: SystemError[];
  systemMetrics: SystemMetric[];
  serviceHealth: ServiceHealth;
  systemAlerts: SystemAlert[];
  health: SystemHealth | null;
  performanceMetrics: PerformanceMetric[];
  performanceInsights: PerformanceInsights;
  isLoading: boolean;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  timeRange: TimeRange;
  realtimeStatus: 'connecting' | 'connected' | 'error';
  refreshAll: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  exportPerformanceData: () => void;
}

// Update the component signature to use the new interface
export function ErrorMonitoringDashboard({
  errorStats,
  recentErrors,
  systemMetrics,
  serviceHealth,
  systemAlerts,
  health,
  performanceMetrics,
  performanceInsights,
  isLoading,
  lastUpdated,
  isRefreshing,
  timeRange,
  realtimeStatus,
  refreshAll,
  acknowledgeAlert,
  setTimeRange,
  exportPerformanceData,
}: ErrorMonitoringDashboardProps) {

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Giám sát Hệ thống</h2>
        <div className="flex items-center space-x-2">
          {/* Error 5: Removed lastUpdated from RealTimeStatusIndicator props as it's not used there */}
          <RealTimeStatusIndicator status={realtimeStatus} />
          <Button onClick={refreshAll} disabled={isLoading || isRefreshing}>
            <RotateCw className={`mr-2 h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="error-list">Danh sách Lỗi</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích Lỗi</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
          <TabsTrigger value="service-status">Dịch vụ</TabsTrigger>
          <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
          <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="error-list" className="space-y-4">
          {/* Error 6: Changed 'errors' to 'recentErrors' and added onRefresh prop */}
          <ErrorListTab recentErrors={recentErrors} isLoading={isLoading} onRefresh={refreshAll} />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <ErrorAnalyticsTab errorStats={errorStats} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          {/* Error 7: Changed 'metrics' to 'performanceMetrics' and passed all required PerformanceTab props */}
          <PerformanceTab
            metrics={performanceMetrics}
            insights={performanceInsights}
            health={health}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onExportData={exportPerformanceData}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="service-status" className="space-y-4">
          {/* Error 8: Changed 'statusData' to 'serviceHealth' */}
          <ServiceStatusTab serviceHealth={serviceHealth} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="resources" className="space-y-4">
          {/* Error 9: Changed 'metrics' to 'systemMetrics' and passed 'health' */}
          <ResourcesTab systemMetrics={systemMetrics} health={health} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="alerts" className="space-y-4">
          {/* Error 10: Added 'onAcknowledge' prop */}
          <SystemAlertsDisplay alerts={systemAlerts} isLoading={isLoading} onAcknowledge={acknowledgeAlert} />
        </TabsContent>
      </Tabs>
    </div>
  );
}