import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ServiceStatusTab } from './error-monitoring/ServiceStatusTab';
import { SystemAlertsDisplay } from './error-monitoring/SystemAlertsDisplay';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { SystemError, SystemAlert } from '@/utils/errorTracking';
import { HealthSummary } from '@/hooks/useErrorMonitoringData'; // Import HealthSummary

interface ErrorMonitoringDashboardProps {
  errorStats: any;
  recentErrors: SystemError[];
  systemAlerts: SystemAlert[];
  health: HealthSummary; // Use the new HealthSummary type
  isLoading: boolean;
  refreshAll: () => void;
  acknowledgeAlert: (alertId: string) => Promise<void>; // Changed to Promise<void>
}

export function ErrorMonitoringDashboard({
  errorStats,
  recentErrors,
  systemAlerts,
  health,
  isLoading,
  refreshAll, // Add refreshAll here
  acknowledgeAlert,
}: ErrorMonitoringDashboardProps) {
  return (
    <div className="space-y-6">
      <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} /> {/* Changed 'stats' to 'errorStats' */}
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
          <ServiceStatusTab serviceHealth={health.services} isLoading={isLoading} />
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