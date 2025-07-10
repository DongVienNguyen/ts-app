import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  SecurityHeader,
  RealTimeMetricsCard,
  SystemOverviewCards,
  AlertConfigurationCard,
  LiveActivityFeed,
  SecurityAlerts
} from '@/components/security';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

export function RealTimeSecurityMonitor() {
  const {
    stats,
    realTimeMetrics,
    isRealTimeEnabled,
    isConnected,
    isPaused,
    alertConfig,
    isLoading,
    error,
    setIsRealTimeEnabled,
    setIsPaused,
    setAlertConfig,
    resetMetrics
  } = useSecurityMonitoring();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không thể tải dữ liệu theo dõi thời gian thực: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <SecurityHeader
        lastUpdated={stats.lastUpdated}
        isConnected={isConnected}
        isRealTimeEnabled={isRealTimeEnabled}
        isPaused={isPaused}
        onRealTimeToggle={setIsRealTimeEnabled}
        onPauseToggle={setIsPaused}
        onReset={resetMetrics}
      />

      <RealTimeMetricsCard
        metrics={realTimeMetrics}
        isRealTimeEnabled={isRealTimeEnabled}
      />

      <SystemOverviewCards stats={stats} />

      <AlertConfigurationCard
        alertConfig={alertConfig}
        onConfigChange={setAlertConfig}
      />

      <LiveActivityFeed
        events={stats.securityEvents}
        isRealTimeEnabled={isRealTimeEnabled}
        isLoading={isLoading}
      />

      <SecurityAlerts
        recentFailedLogins={stats.recentFailedLogins}
        suspiciousActivities={stats.suspiciousActivities}
      />
    </div>
  );
}