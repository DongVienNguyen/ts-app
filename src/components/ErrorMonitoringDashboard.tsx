import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMonitoringHeader } from './error-monitoring/ErrorMonitoringHeader';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { ErrorAnalyticsTab } from './error-monitoring/ErrorAnalyticsTab';
import { ServiceStatusTab } from './error-monitoring/ServiceStatusTab';
import { ResourcesTab } from './error-monitoring/ResourcesTab';
import { RealTimeErrorFeed } from './error-monitoring/RealTimeErrorFeed';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import VAPIDKeyTester from '@/components/VAPIDKeyTester';

export function ErrorMonitoringDashboard() {
  const {
    errorStats,
    recentErrors,
    systemMetrics,
    serviceHealth,
    isLoading,
    lastUpdated,
    refreshAll,
    getStatusColor,
    getSeverityColor: originalGetSeverityColor,
    isRefreshingErrors,
    refreshRecentErrors, // Add this line
  } = useErrorMonitoringData();

  const getSeverityColor = (severity: string | undefined): string => {
    if (!severity) return 'text-gray-600 bg-gray-100';
    return originalGetSeverityColor(severity);
  };

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
            </TabsList>

            <TabsContent value="errors">
              <ErrorListTab
                recentErrors={recentErrors}
                isLoading={isLoading}
                getSeverityColor={getSeverityColor}
                onRefresh={refreshRecentErrors} // Changed from refreshAll to refreshRecentErrors
              />
            </TabsContent>

            <TabsContent value="analytics">
              <ErrorAnalyticsTab
                errorStats={errorStats}
              />
            </TabsContent>

            <TabsContent value="services">
              <ServiceStatusTab
                serviceHealth={serviceHealth}
                getStatusColor={getStatusColor}
              />
            </TabsContent>

            <TabsContent value="resources">
              <ResourcesTab
                systemMetrics={systemMetrics}
              />
            </TabsContent>
            
            <TabsContent value="pwa_push" className="space-y-6">
              <PWATestPanel />
              <PushNotificationTester />
              <VAPIDKeyTester />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <RealTimeErrorFeed onNewError={refreshAll} />
        </div>
      </div>
    </div>
  );
}