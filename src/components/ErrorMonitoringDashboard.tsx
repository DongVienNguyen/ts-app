import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMonitoringHeader } from './error-monitoring/ErrorMonitoringHeader';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { ErrorAnalyticsTab } from './error-monitoring/ErrorAnalyticsTab';
import { ServiceStatusTab } from './error-monitoring/ServiceStatusTab';
import { ResourcesTab } from './error-monitoring/ResourcesTab';
import { RealTimeErrorFeed } from './error-monitoring/RealTimeErrorFeed';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import VAPIDKeyTester from '@/components/VAPIDKeyTester';
import { SystemError, SystemMetric } from '@/utils/errorTracking';
import { ServiceHealth } from './error-monitoring/ServiceStatusTab';
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';

interface ErrorMonitoringDashboardProps {
  errorStats: {
    totalErrors: number;
    criticalErrors: number;
    resolvedErrors: number;
    errorRate: number;
    topErrorTypes: { type: string; count: number }[];
    errorTrend: { date: string; count: number }[];
    byType: { [key: string]: number };
    bySeverity: { [key: string]: number };
    byBrowser: { [key: string]: number };
    byOS: { [key: string]: number };
    recent: SystemError[];
  };
  recentErrors: SystemError[];
  systemMetrics: SystemMetric[];
  serviceHealth: ServiceHealth;
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshAll: () => void;
  refreshRecentErrors: () => void;
  isRefreshingErrors: boolean;
}

export function ErrorMonitoringDashboard({
  errorStats,
  recentErrors,
  systemMetrics,
  serviceHealth,
  isLoading,
  lastUpdated,
  refreshAll,
  refreshRecentErrors,
  isRefreshingErrors,
}: ErrorMonitoringDashboardProps) {
  return (
    <div className="space-y-6">
      <ErrorMonitoringHeader 
        isLoading={isLoading}
        isRefreshing={isRefreshingErrors}
        lastUpdated={lastUpdated}
        onRefresh={refreshAll}
      />

      <ErrorOverviewCards 
        errorStats={errorStats}
        isLoading={isLoading} // Pass isLoading prop
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="errors" className="space-y-4">
            <TabsList className="flex flex-wrap w-full justify-start gap-1 sm:gap-2">
              <TabsTrigger value="errors">Danh sách Lỗi</TabsTrigger>
              <TabsTrigger value="analytics">Phân tích</TabsTrigger>
              <TabsTrigger value="services">Dịch vụ</TabsTrigger>
              <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
              <TabsTrigger value="pwa_push">PWA & Push</TabsTrigger>
              <TabsTrigger value="settings">Cài đặt Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="errors">
              <ErrorListTab
                recentErrors={recentErrors}
                isLoading={isLoading}
                onRefresh={refreshRecentErrors}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <ErrorAnalyticsTab
                errorStats={errorStats}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="services">
              <ServiceStatusTab
                serviceHealth={serviceHealth}
              />
            </TabsContent>

            <TabsContent value="resources">
              <ResourcesTab
                systemMetrics={systemMetrics}
                isLoading={isLoading}
              />
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

        <div className="space-y-6">
          <RealTimeErrorFeed onNewError={refreshRecentErrors} />
        </div>
      </div>
    </div>
  );
}