import { useState } from 'react';
import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';

const ErrorMonitoring = () => {
  const { user } = useAuth();
  const {
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
  } = useErrorMonitoringData();
  const [activeTab, setActiveTab] = useState('dashboard');

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Bảng điều khiển</TabsTrigger>
            <TabsTrigger value="admin-settings">Cài đặt Admin</TabsTrigger>
            <TabsTrigger value="pwa-test">PWA & Push Test</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <ErrorMonitoringDashboard
              errorStats={errorStats}
              recentErrors={recentErrors}
              systemMetrics={systemMetrics}
              serviceHealth={serviceHealth}
              systemAlerts={systemAlerts}
              health={health}
              performanceMetrics={performanceMetrics}
              performanceInsights={performanceInsights}
              isLoading={isLoading}
              lastUpdated={lastUpdated}
              isRefreshing={isRefreshing}
              timeRange={timeRange}
              realtimeStatus={realtimeStatus}
              refreshAll={refreshAll}
              acknowledgeAlert={acknowledgeAlert}
              setTimeRange={setTimeRange}
              exportPerformanceData={exportPerformanceData}
            />
          </TabsContent>
          <TabsContent value="admin-settings" className="mt-6">
            <AdminEmailSettings />
          </TabsContent>
          <TabsContent value="pwa-test" className="mt-6">
            <div className="space-y-6">
              <PWATestPanel />
              <PushNotificationTester />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ErrorMonitoring;