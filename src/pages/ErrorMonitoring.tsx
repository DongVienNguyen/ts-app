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

const ErrorMonitoring = () => {
  const { user } = useAuth();
  const {
    errorStats,
    recentErrors,
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
        <ErrorMonitoringHeader
          isLoading={isLoading}
          isRefreshing={isRefreshingErrors}
          lastUpdated={lastUpdated}
          onRefresh={refreshRecentErrors}
        />

        <ErrorOverviewCards errorStats={errorStats} />

        <Tabs defaultValue="errors" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="errors">Danh sách lỗi</TabsTrigger>
            <TabsTrigger value="analytics">Phân tích</TabsTrigger>
            <TabsTrigger value="services">Trạng thái Dịch vụ</TabsTrigger>
            <TabsTrigger value="pwa">PWA & Push</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="errors">
            <ErrorListTab
              recentErrors={recentErrors}
              isLoading={isLoading}
              getSeverityColor={getSeverityColor}
              onRefresh={refreshAll}
            />
          </TabsContent>

          <TabsContent value="services">
            <ServiceStatusTab serviceHealth={serviceHealth} getStatusColor={getStatusColor} />
          </TabsContent>

          <TabsContent value="analytics">
            <ErrorAnalyticsTab errorStats={errorStats} />
          </TabsContent>

          <TabsContent value="pwa" className="space-y-6">
            <PWATestPanel />
            <PushNotificationTester />
            <VAPIDKeyTester />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminEmailSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ErrorMonitoring;