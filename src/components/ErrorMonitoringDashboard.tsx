import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMonitoringHeader } from '@/components/error-monitoring/ErrorMonitoringHeader';
import { ErrorOverviewCards } from '@/components/error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from '@/components/error-monitoring/ErrorListTab';
import { ErrorAnalyticsTab } from '@/components/error-monitoring/ErrorAnalyticsTab';
import { ServiceStatusTab } from '@/components/error-monitoring/ServiceStatusTab';
import { ResourcesTab } from '@/components/error-monitoring/ResourcesTab';
import { RealTimeErrorFeed } from '@/components/error-monitoring/RealTimeErrorFeed';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';

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
    getSeverityColor
  } = useErrorMonitoringData();

  const handleNewError = () => {
    // Refresh data when new error is detected
    refreshAll();
  };

  return (
    <div className="space-y-6">
      <ErrorMonitoringHeader
        lastUpdated={lastUpdated}
        onRefresh={refreshAll}
      />

      <ErrorOverviewCards errorStats={errorStats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="errors">Danh sách Lỗi</TabsTrigger>
              <TabsTrigger value="analytics">Phân tích</TabsTrigger>
              <TabsTrigger value="services">Dịch vụ</TabsTrigger>
              <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
            </TabsList>

            <TabsContent value="errors" className="space-y-4">
              <ErrorListTab
                recentErrors={recentErrors}
                isLoading={isLoading}
                getSeverityColor={getSeverityColor}
                onRefresh={refreshAll}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <ErrorAnalyticsTab errorStats={errorStats} />
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <ServiceStatusTab
                serviceHealth={serviceHealth}
                getStatusColor={getStatusColor}
              />
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <ResourcesTab systemMetrics={systemMetrics} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <RealTimeErrorFeed onNewError={handleNewError} />
        </div>
      </div>
    </div>
  );
}