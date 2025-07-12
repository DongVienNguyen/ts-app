import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorMonitoringHeader } from './error-monitoring/ErrorMonitoringHeader';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { ServiceStatusTab } from './error-monitoring/ServiceStatusTab';
import { ErrorAnalyticsTab } from './error-monitoring/ErrorAnalyticsTab';
import { RealTimeErrorFeed } from './error-monitoring/RealTimeErrorFeed';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import VAPIDKeyTester from '@/components/VAPIDKeyTester';
import { SystemError, SystemMetric, SystemStatus, SystemAlert } from '@/utils/errorTracking'; // Import SystemStatus and SystemAlert
import { ServiceHealth } from './error-monitoring/ServiceStatusTab';
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';
import { SystemAlertsDisplay } from './error-monitoring/SystemAlertsDisplay';
import { Card, CardHeader } from '@/components/ui/card'; // Import Card and CardHeader
import { ResourcesTab } from './error-monitoring/ResourcesTab'; // Import ResourcesTab

interface ErrorMonitoringDashboardProps {
  errorStats: any;
  recentErrors: SystemError[];
  systemMetrics: SystemMetric[];
  serviceHealth: SystemStatus[];
  systemAlerts: SystemAlert[];
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshAll: () => void;
  refreshRecentErrors: () => void;
  isRefreshingErrors: boolean;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  isRefreshingAlerts: boolean;
}

export function ErrorMonitoringDashboard({
  errorStats,
  recentErrors,
  systemMetrics,
  serviceHealth,
  systemAlerts,
  isLoading,
  lastUpdated,
  refreshAll,
  refreshRecentErrors,
  isRefreshingErrors,
  acknowledgeAlert,
  isRefreshingAlerts,
}: ErrorMonitoringDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <ErrorMonitoringHeader 
        isLoading={isLoading}
        isRefreshing={isRefreshingErrors}
        lastUpdated={lastUpdated}
        onRefresh={refreshAll}
      />

      <div className="space-y-4">
        <SystemAlertsDisplay
          alerts={systemAlerts}
          onAcknowledge={acknowledgeAlert}
          isLoading={isRefreshingAlerts || isLoading}
        />
        <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} /> {/* Changed 'stats' to 'errorStats' */}
        <Card>
          <CardHeader>
            <Tabs defaultValue="errors" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                  // Removed initialFilter and onFilterApplied as they are not defined here
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
                  isLoading={isLoading}
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
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6">
        <RealTimeErrorFeed onNewError={refreshRecentErrors} />
      </div>
    </div>
  );
}