import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { SecurityHeader } from '@/components/security/SecurityHeader';
import { RealTimeMetricsCard } from '@/components/security/RealTimeMetricsCard';
import { LiveActivityFeed } from '@/components/security/LiveActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users } from 'lucide-react';
import { ActiveUsersCard } from './security/ActiveUsersCard';

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
  } = useRealTimeSecurityMonitoring();

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart className="w-5 h-5" />
                <span>Phân tích Mối đe dọa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 text-center py-8">
                Biểu đồ phân tích mối đe dọa sẽ được hiển thị ở đây trong các phiên bản tương lai.
              </p>
            </CardContent>
          </Card>
          <ActiveUsersCard events={events} />
        </div>
      </div>
    </div>
  );
}