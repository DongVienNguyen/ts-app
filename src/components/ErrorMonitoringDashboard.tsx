import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ServiceStatusTab, ServiceHealth } from './error-monitoring/ServiceStatusTab';
import { SystemAlertsDisplay } from './error-monitoring/SystemAlertsDisplay';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { SystemError, SystemAlert, SystemStatus } from '@/types/system';
import { SystemHealth } from '@/components/system-health/types';
import { SystemHealthGrid } from './system-health/SystemHealthGrid';
import { SystemHealthMetric } from './system-health/types';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, Database, Server, Mail, Bell, TrendingUp } from 'lucide-react';

// Helper function to map SystemHealthMetric to SystemStatus
const mapHealthMetricToSystemStatus = (metric: SystemHealthMetric | undefined): SystemStatus => {
  if (!metric) {
    return {
      service_name: 'Unknown',
      status: 'offline',
      response_time_ms: 0,
      error_rate: 1,
      uptime_percentage: 0,
      last_check: new Date().toISOString(),
      status_data: null
    };
  }

  let mappedStatus: 'online' | 'degraded' | 'offline';
  switch (metric.status) {
    case 'healthy':
      mappedStatus = 'online';
      break;
    case 'warning':
      mappedStatus = 'degraded';
      break;
    case 'error':
      mappedStatus = 'offline';
      break;
    default:
      mappedStatus = 'offline';
  }

  return {
    service_name: '',
    status: mappedStatus,
    response_time_ms: metric.responseTime || 0,
    error_rate: 0,
    uptime_percentage: metric.uptime || 0,
    last_check: metric.lastCheck,
    status_data: null
  };
};

interface ErrorMonitoringDashboardProps {
  errorStats: any;
  recentErrors: SystemError[];
  systemAlerts: SystemAlert[];
  health: SystemHealth | null;
  isLoading: boolean;
  refreshAll: () => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

export function ErrorMonitoringDashboard({
  errorStats,
  recentErrors,
  systemAlerts,
  health,
  isLoading,
  refreshAll,
  acknowledgeAlert,
}: ErrorMonitoringDashboardProps) {

  // Construct serviceHealth object for ServiceStatusTab
  const serviceHealthForTab: ServiceHealth = {
    database: mapHealthMetricToSystemStatus(health?.database),
    api: mapHealthMetricToSystemStatus(health?.api),
    email: mapHealthMetricToSystemStatus(health?.email),
    pushNotification: mapHealthMetricToSystemStatus(health?.pushNotification),
  };

  // Calculate system status
  const getOverallSystemStatus = () => {
    if (!health) return { status: 'unknown', color: 'gray', text: 'Không xác định' };
    
    const services = [health.database, health.api, health.email, health.pushNotification];
    const hasError = services.some(service => service?.status === 'error');
    const hasWarning = services.some(service => service?.status === 'warning');
    
    if (hasError) return { status: 'error', color: 'red', text: 'Có lỗi nghiêm trọng' };
    if (hasWarning) return { status: 'warning', color: 'yellow', text: 'Có cảnh báo' };
    return { status: 'healthy', color: 'green', text: 'Hoạt động bình thường' };
  };

  const systemStatus = getOverallSystemStatus();

  return (
    <div className="space-y-6">
      {/* Header Section với System Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Overall System Status */}
        <Card className={`bg-gradient-to-r ${
          systemStatus.color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
          systemStatus.color === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
          systemStatus.color === 'red' ? 'from-red-50 to-red-100 border-red-200' :
          'from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                systemStatus.color === 'green' ? 'bg-green-500' :
                systemStatus.color === 'yellow' ? 'bg-yellow-500' :
                systemStatus.color === 'red' ? 'bg-red-500' :
                'bg-gray-500'
              }`}>
                {systemStatus.status === 'healthy' ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : systemStatus.status === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-white" />
                ) : (
                  <Activity className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  systemStatus.color === 'green' ? 'text-green-900' :
                  systemStatus.color === 'yellow' ? 'text-yellow-900' :
                  systemStatus.color === 'red' ? 'text-red-900' :
                  'text-gray-900'
                }`}>
                  Trạng thái Hệ thống
                </p>
                <p className={`text-xs ${
                  systemStatus.color === 'green' ? 'text-green-700' :
                  systemStatus.color === 'yellow' ? 'text-yellow-700' :
                  systemStatus.color === 'red' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {systemStatus.text}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={`${
                  systemStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                  systemStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  systemStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {systemStatus.status === 'healthy' ? 'Ổn định' :
                 systemStatus.status === 'warning' ? 'Cảnh báo' :
                 systemStatus.status === 'error' ? 'Lỗi' :
                 'N/A'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Database</p>
                <p className="text-xs text-blue-700">
                  {health?.database?.status === 'healthy' ? 'Kết nối tốt' :
                   health?.database?.status === 'warning' ? 'Chậm' :
                   health?.database?.status === 'error' ? 'Lỗi kết nối' : 'Đang kiểm tra'}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={`${
                  health?.database?.status === 'healthy' ? 'bg-green-100 text-green-800' :
                  health?.database?.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {health?.database?.uptime ? `${health.database.uptime}%` : 'N/A'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* API Server Status */}
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Server className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">API Server</p>
                <p className="text-xs text-purple-700">
                  {health?.api?.responseTime ? `${health.api.responseTime}ms` : 'Đang đo'}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={`${
                  health?.api?.status === 'healthy' ? 'bg-green-100 text-green-800' :
                  health?.api?.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {health?.api?.status === 'healthy' ? 'Online' :
                 health?.api?.status === 'warning' ? 'Slow' :
                 health?.api?.status === 'error' ? 'Error' : 'N/A'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Email & Push Status */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Email & Push</p>
                <p className="text-xs text-green-700">
                  {health?.email?.status === 'healthy' && health?.pushNotification?.status === 'healthy' ? 
                   'Sẵn sàng gửi' : 'Cần kiểm tra'}
                </p>
              </div>
              <Badge 
                variant="secondary" 
                className={`${
                  health?.email?.status === 'healthy' && health?.pushNotification?.status === 'healthy' ? 
                  'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {health?.email?.status === 'healthy' && health?.pushNotification?.status === 'healthy' ? 
                 'Ready' : 'Check'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Overview Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Tổng quan Lỗi Hệ thống</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            7 ngày qua
          </Badge>
        </div>
        <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} />
      </div>

      {/* System Health Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết Sức khỏe Hệ thống</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            Real-time
          </Badge>
        </div>
        <SystemHealthGrid health={health} isLoading={isLoading} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Errors - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Lỗi Gần đây
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {recentErrors.length} lỗi
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ErrorListTab 
                recentErrors={recentErrors} 
                isLoading={isLoading} 
                isPaginated={false} 
                onRefresh={refreshAll} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Service Status */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Trạng thái Dịch vụ</h3>
            </div>
            <ServiceStatusTab serviceHealth={serviceHealthForTab} isLoading={isLoading} />
          </div>

          {/* System Alerts */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Cảnh báo Hệ thống</h3>
            </div>
            <SystemAlertsDisplay
              alerts={systemAlerts}
              isLoading={isLoading}
              onAcknowledge={acknowledgeAlert}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <p className="font-medium mb-1">Hệ thống Giám sát - Tài sản CRC</p>
            <p>Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}