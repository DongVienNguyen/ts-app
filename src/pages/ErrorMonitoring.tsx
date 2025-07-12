import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';

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
      </div>
    </Layout>
  );
};

export default ErrorMonitoring;