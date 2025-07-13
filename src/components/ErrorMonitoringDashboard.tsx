import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorOverviewCards } from '@/components/error-monitoring/ErrorOverviewCards';
import { ErrorListTab } from '@/components/error-monitoring/ErrorListTab';
import { ErrorAnalyticsTab } from '@/components/error-monitoring/ErrorAnalyticsTab';
import { SystemAlertsDisplay } from '@/components/error-monitoring/SystemAlertsDisplay';
import { SystemHealthGrid } from '@/components/system-health/SystemHealthGrid';

// Import necessary types for props
import { SystemError, SystemAlert } from '@/utils/errorTracking';
import { SystemHealth } from '@/components/system-health/types';

// Define the props interface for ErrorMonitoringDashboard
interface ErrorMonitoringDashboardProps {
  errorStats: any;
  recentErrors: SystemError[];
  systemAlerts: SystemAlert[];
  health: SystemHealth | null;
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

// Update the component signature to use the new interface
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
      {/* Section 1: Overview Cards */}
      <ErrorOverviewCards errorStats={errorStats} isLoading={isLoading} />

      {/* Section 2: System Health Grid */}
      <SystemHealthGrid health={health} isLoading={isLoading} />

      {/* Section 3: Active System Alerts (only show if there are alerts) */}
      {systemAlerts && systemAlerts.length > 0 && (
        <SystemAlertsDisplay alerts={systemAlerts} isLoading={isLoading} onAcknowledge={acknowledgeAlert} />
      )}

      {/* Section 4: Error Analytics */}
      <ErrorAnalyticsTab errorStats={errorStats} isLoading={isLoading} />

      {/* Section 5: Recent Errors List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Lỗi gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorListTab recentErrors={recentErrors} isLoading={isLoading} onRefresh={refreshAll} />
        </CardContent>
      </Card>
    </div>
  );
}