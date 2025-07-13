import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ServiceStatusTab, ServiceHealth } from './error-monitoring/ServiceStatusTab'; // Import ServiceHealth
import { SystemAlertsDisplay } from './error-monitoring/SystemAlertsDisplay';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { SystemError, SystemAlert, SystemStatus } from '@/utils/errorTracking'; // Import SystemStatus
import { SystemHealth } from '@/components/system-health/types'; // Import SystemHealth
import { SystemHealthGrid } from './system-health/SystemHealthGrid';
import { SystemHealthMetric } from './system-health/types'; // Import SystemHealthMetric

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
    service_name: '', // This will be set by ServiceStatusTab based on its internal service list
    status: mappedStatus,
    response_time_ms: metric.responseTime || 0,
    error_rate: 0, // Not directly available from SystemHealthMetric
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

  return (
    <div className="space-y-6">
      <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} />
      <SystemHealthGrid health={health} isLoading={isLoading} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Lỗi gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorListTab recentErrors={recentErrors} isLoading={isLoading} isPaginated={false} onRefresh={refreshAll} />
          </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-6">
          <ServiceStatusTab serviceHealth={serviceHealthForTab} isLoading={isLoading} />
          <SystemAlertsDisplay
            alerts={systemAlerts}
            isLoading={isLoading}
            onAcknowledge={acknowledgeAlert}
          />
        </div>
      </div>
    </div>
  );
}