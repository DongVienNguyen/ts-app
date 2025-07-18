import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { RealTimeStatusIndicator } from '@/components/error-monitoring/RealTimeStatusIndicator';
import { AdminToolsPanel } from '@/components/admin/AdminToolsPanel';
import { useExternalAssetSync } from '@/hooks/useExternalAssetSync';
import { ExternalSyncStatus } from '@/components/error-monitoring/ExternalSyncStatus';

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
  const externalSync = useExternalAssetSync();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chỉ admin mới có thể truy cập trang Giám sát Hệ thống.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
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
          <TabsTrigger value="external-sync">Đồng bộ API Ngoài</TabsTrigger>
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
        <TabsContent value="external-sync" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ExternalSyncStatus {...externalSync} />
          </div>
        </TabsContent>
        <TabsContent value="admin-tools" className="mt-6">
          <AdminToolsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ErrorMonitoring;