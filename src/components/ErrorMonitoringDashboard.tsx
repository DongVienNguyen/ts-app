import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMonitoringHeader } from './error-monitoring/ErrorMonitoringHeader';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { ServiceStatusTab, ServiceHealth } from './error-monitoring/ServiceStatusTab';
import { ErrorAnalyticsTab } from './error-monitoring/ErrorAnalyticsTab';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import VAPIDKeyTester from '@/components/VAPIDKeyTester';
import { SystemError, SystemMetric, SystemAlert } from '@/utils/errorTracking';
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';
import { SystemAlertsDisplay } from './error-monitoring/SystemAlertsDisplay';
import { Card, CardHeader } from '@/components/ui/card';
import { ResourcesTab } from './error-monitoring/ResourcesTab';
import { PerformanceTab } from './error-monitoring/PerformanceTab';
import { PerformanceMetric, PerformanceInsights, TimeRange } from '@/components/system-health/performance/types';
import { SystemHealth } from '@/components/system-health/types';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';

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
  refreshAll: () => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  exportPerformanceData: () => void;
}

export function ErrorMonitoringDashboard({
  errorStats, recentErrors, systemMetrics, serviceHealth, systemAlerts, health,
  performanceMetrics, performanceInsights, isLoading, lastUpdated, isRefreshing,
  timeRange, realtimeStatus, refreshAll, acknowledgeAlert, setTimeRange, exportPerformanceData,
}: ErrorMonitoringDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [initialFilter, setInitialFilter] = useState<any>(null);

  const handleCardClick = (type: 'severity' | 'status', value: string) => {
    setInitialFilter({ type, value });
    setActiveTab('errors');
  };

  return (
    <div className="h-full flex flex-col">
      <ErrorMonitoringHeader
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={refreshAll}
        realtimeStatus={realtimeStatus}
      />
      <div className="flex-grow">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex flex-wrap w-full justify-start gap-1 sm:gap-2">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="errors">Danh sách Lỗi</TabsTrigger>
            <TabsTrigger value="analytics">Phân tích Lỗi</TabsTrigger>
            <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
            <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
            <TabsTrigger value="pwa_push">PWA & Push</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} onCardClick={handleCardClick} />
          </TabsContent>

          <TabsContent value="errors">
            <ErrorListTab
              recentErrors={recentErrors}
              isLoading={isLoading}
              onRefresh={refreshAll}
              initialFilter={initialFilter}
              onFilterApplied={() => setInitialFilter(null)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <ErrorAnalyticsTab errorStats={errorStats} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="performance">
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

          <TabsContent value="services">
            <ServiceStatusTab serviceHealth={serviceHealth} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesTab health={health} systemMetrics={systemMetrics} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="pwa_push" className="space-y-6">
            <PWATestPanel />
            <PushNotificationTester />
            <VAPIDKeyTester />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminEmailSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}