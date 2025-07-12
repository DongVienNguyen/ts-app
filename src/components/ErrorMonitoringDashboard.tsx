import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMonitoringHeader } from './error-monitoring/ErrorMonitoringHeader';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { ServiceStatusTab, ServiceHealth } from './error-monitoring/ServiceStatusTab';
import { ErrorAnalyticsTab } from './error-monitoring/ErrorAnalyticsTab';
import { RealTimeErrorFeed } from './error-monitoring/RealTimeErrorFeed';
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
  refreshAll: () => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  exportPerformanceData: () => void;
}

export function ErrorMonitoringDashboard({
  errorStats, recentErrors, systemMetrics, serviceHealth, systemAlerts, health,
  performanceMetrics, performanceInsights, isLoading, lastUpdated, isRefreshing,
  timeRange, refreshAll, acknowledgeAlert, setTimeRange, exportPerformanceData,
}: ErrorMonitoringDashboardProps) {
  const [activeTab, setActiveTab] = useState('errors');
  const [cardFilter, setCardFilter] = useState<{ type: 'severity' | 'status'; value: string } | null>(null);

  const handleCardClick = (type: 'severity' | 'status', value: string) => {
    setCardFilter({ type, value });
    setActiveTab('errors');
  };

  return (
    <div className="space-y-6">
      <ErrorMonitoringHeader 
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        onRefresh={refreshAll}
      />

      <div className="space-y-4">
        <SystemAlertsDisplay
          alerts={systemAlerts}
          onAcknowledge={acknowledgeAlert}
          isLoading={isLoading}
        />
        <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} onCardClick={handleCardClick} />
        <Card>
          <CardHeader>
            <Tabs defaultValue="errors" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex flex-wrap w-full justify-start gap-1 sm:gap-2">
                <TabsTrigger value="errors">Danh sách Lỗi</TabsTrigger>
                <TabsTrigger value="analytics">Phân tích Lỗi</TabsTrigger>
                <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
                <TabsTrigger value="services">Dịch vụ</TabsTrigger>
                <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
                <TabsTrigger value="pwa_push">PWA & Push</TabsTrigger>
                <TabsTrigger value="settings">Cài đặt</TabsTrigger>
              </TabsList>

              <TabsContent value="errors">
                <ErrorListTab
                  recentErrors={recentErrors}
                  isLoading={isLoading}
                  onRefresh={refreshAll}
                  initialFilter={cardFilter}
                  onFilterApplied={() => setCardFilter(null)}
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
                <ResourcesTab health={health} isLoading={isLoading} />
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
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6">
        <RealTimeErrorFeed onNewError={refreshAll} />
      </div>
    </div>
  );
}