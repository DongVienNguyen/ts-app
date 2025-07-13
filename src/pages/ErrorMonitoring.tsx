import { useState } from 'react';
import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import { Button } from '@/components/ui/button';
import { RealTimeStatusIndicator } from '@/components/error-monitoring/RealTimeStatusIndicator';

const ErrorMonitoring = () => {
  const { user } = useAuth();
  const {
    errorStats,
    recentErrors,
    systemAlerts,
    health,
    isLoading,
    isRefreshing,
    realtimeStatus,
    refreshAll,
    acknowledgeAlert,
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
              Chỉ admin mới có thể truy cập trang Giám sát Hệ thống.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Giám sát Hệ thống</h2>
          <div className="flex items-center space-x-2">
            <RealTimeStatusIndicator status={realtimeStatus} />
            <Button onClick={refreshAll} disabled={isLoading || isRefreshing}>
              <RotateCw className={`mr-2 h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Bảng điều khiển</TabsTrigger>
            <TabsTrigger value="admin-tools">Công cụ Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <ErrorMonitoringDashboard
              errorStats={errorStats}
              recentErrors={recentErrors}
              systemAlerts={systemAlerts}
              health={health}
              isLoading={isLoading}
              refreshAll={refreshAll}
              acknowledgeAlert={acknowledgeAlert}
            />
          </TabsContent>
          <TabsContent value="admin-tools" className="mt-6">
            <div className="space-y-6">
              <AdminEmailSettings />
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