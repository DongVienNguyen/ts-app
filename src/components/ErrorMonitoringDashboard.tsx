import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorOverviewCards } from './error-monitoring/ErrorOverviewCards';
import { ServiceStatusTab } from './error-monitoring/ServiceStatusTab';
import { SystemAlertsDisplay } from './error-monitoring/SystemAlertsDisplay';
import { ErrorListTab } from './error-monitoring/ErrorListTab';
import { SystemError, SystemAlert } from '@/utils/errorTracking';
import { SystemHealth } from '@/components/system-health/types'; // Import SystemHealth
import { SystemHealthGrid } from './system-health/SystemHealthGrid';

interface ErrorMonitoringDashboardProps {
  errorStats: any;
  recentErrors: SystemError[];
  systemAlerts: SystemAlert[];
  health: SystemHealth | null; // Changed to SystemHealth | null
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
  return (
    <div className="space-y-6">
      <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} />
      <SystemHealthGrid health={health} isLoading={isLoading} /> {/* Removed 'as any' cast */}
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
          <ServiceStatusTab serviceHealth={health?.services} isLoading={isLoading} /> {/* Added optional chaining for services */}
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