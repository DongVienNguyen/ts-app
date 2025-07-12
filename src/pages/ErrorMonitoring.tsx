import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import { VAPIDKeyTester } from '@/components/VAPIDKeyTester';
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';

// Import the tab components
import { ErrorListTab } from '@/components/error-monitoring/ErrorListTab';
import { ErrorAnalyticsTab } from '@/components/error-monitoring/ErrorAnalyticsTab';
import { ServiceStatusTab } from '@/components/error-monitoring/ServiceStatusTab';
import { ErrorOverviewCards } from '@/components/error-monitoring/ErrorOverviewCards';
import { ErrorMonitoringHeader } from '@/components/error-monitoring/ErrorMonitoringHeader';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard'; // Import the dashboard component

const ErrorMonitoring = () => {
  const { user } = useAuth();
  const {
    errorStats,
    recentErrors,
    systemMetrics, // Add systemMetrics
    serviceHealth,
    isLoading,
    lastUpdated,
    refreshAll,
    refreshRecentErrors,
    isRefreshingErrors,
    getSeverityColor,
    getStatusColor,
  } = useErrorMonitoringData();

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chỉ admin mới có thể truy cập trang Giám sát Lỗi.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Render the main dashboard component */}
        <ErrorMonitoringDashboard
          errorStats={errorStats}
          recentErrors={recentErrors}
          systemMetrics={systemMetrics}
          serviceHealth={serviceHealth}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
          refreshAll={refreshAll}
          refreshRecentErrors={refreshRecentErrors}
          isRefreshingErrors={isRefreshingErrors}
          getStatusColor={getStatusColor}
          getSeverityColor={getSeverityColor}
        />

        {/* Add the AdminEmailSettings tab separately if needed, or integrate into dashboard */}
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="settings">Cài đặt Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-6">
            <AdminEmailSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ErrorMonitoring;