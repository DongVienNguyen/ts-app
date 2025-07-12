import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { SecurityHeader } from '@/components/security/SecurityHeader';
import { RealTimeMetricsCard } from '@/components/security/RealTimeMetricsCard';
import { LiveActivityFeed } from '@/components/security/LiveActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users } from 'lucide-react';
import { ActiveUsersCard } from './security/ActiveUsersCard';
import { ThreatAnalysisCard } from './security/ThreatAnalysisCard'; // Import the new component

export function RealTimeSecurityDashboard() {
  const {
    events,
    metrics,
    lastUpdated,
    isConnected,
    isRealTimeEnabled,
    isPaused,
    isLoading,
    error,
    handleRealTimeToggle,
    handlePauseToggle,
    handleReset,
    getEventTrends // Get the new function from the hook
  } = useRealTimeSecurityMonitoring();

  const threatData = getEventTrends(); // Get the processed data for the chart

  if (error) {
    return <div className="text-red-500">Lỗi: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <SecurityHeader
        lastUpdated={lastUpdated}
        isConnected={isConnected}
        isRealTimeEnabled={isRealTimeEnabled}
        isPaused={isPaused}
        onRealTimeToggle={handleRealTimeToggle}
        onPauseToggle={handlePauseToggle}
        onReset={handleReset}
      />
      <RealTimeMetricsCard metrics={metrics} isRealTimeEnabled={isRealTimeEnabled} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveActivityFeed events={events} isRealTimeEnabled={isRealTimeEnabled} isLoading={isLoading} />
        </div>
        <div className="space-y-6">
          {/* Replace the placeholder Card with ThreatAnalysisCard */}
          <ThreatAnalysisCard data={threatData} />
          <ActiveUsersCard events={events} />
        </div>
      </div>
    </div>
  );
}