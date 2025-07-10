import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMonitoringHeader } from '@/components/error-monitoring/ErrorMonitoringHeader';
import { ErrorOverviewCards } from '@/components/error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from '@/components/error-monitoring/ErrorListTab';
import { ErrorAnalyticsTab } from '@/components/error-monitoring/ErrorAnalyticsTab';
import { ServiceStatusTab } from '@/components/error-monitoring/ServiceStatusTab';
import { ResourcesTab } from '@/components/error-monitoring/ResourcesTab';
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

  return (
    <div className="space-y-6">
      <ErrorMonitoringHeader
        lastUpdated={lastUpdated}
        onRefresh={refreshAll}
      />

      <ErrorOverviewCards errorStats={errorStats} />

      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="errors">Danh sách Lỗi</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          <TabsTrigger value="services">Trạng thái Dịch vụ</TabsTrigger>
          <TabsTrigger value="resources">Tài nguyên</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <ErrorListTab
            recentErrors={recentErrors}
            isLoading={isLoading}
            getSeverityColor={getSeverityColor}
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
  );
}