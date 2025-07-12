import { useState, useEffect, useMemo } from 'react';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { SecurityHeader } from './security/SecurityHeader';
import { RealTimeMetricsCard } from './security/RealTimeMetricsCard';
import { LiveActivityFeed } from './security/LiveActivityFeed';
import { ThreatAnalysisCard } from './security/ThreatAnalysisCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSecureAuth } from '@/contexts/AuthContext';

export function RealTimeSecurityDashboard() {
  const { user } = useSecureAuth();
  const realTimeData = useRealTimeSecurityMonitoring();
  
  const [isPaused, setIsPaused] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [snapshotData, setSnapshotData] = useState(realTimeData);

  useEffect(() => {
    if (!isPaused && isRealTimeEnabled) {
      setSnapshotData(realTimeData);
      setLastUpdated(new Date());
    }
  }, [realTimeData, isPaused, isRealTimeEnabled]);

  const dataToDisplay = isRealTimeEnabled ? (isPaused ? snapshotData : realTimeData) : snapshotData;

  const handleRealTimeToggle = (enabled: boolean) => {
    setIsRealTimeEnabled(enabled);
    if (!enabled) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  };

  const handlePauseToggle = () => {
    if (isRealTimeEnabled) {
      setIsPaused(prev => !prev);
    }
  };

  const handleReset = () => {
    realTimeData.logEvent('METRICS_RESET', { resetBy: user?.username || 'unknown' });
    toast.success("Đã gửi yêu cầu đặt lại số liệu.");
  };

  const metrics = useMemo(() => {
    const events = dataToDisplay.recentEvents || [];
    return {
      loginAttempts: events.filter(e => e.type === 'LOGIN_SUCCESS' || e.type === 'LOGIN_FAILED').length,
      successfulLogins: events.filter(e => e.type === 'LOGIN_SUCCESS').length,
      failedLogins: events.filter(e => e.type === 'LOGIN_FAILED').length,
      accountLocks: events.filter(e => e.type === 'ACCOUNT_LOCKED').length,
      passwordResets: events.filter(e => e.type === 'PASSWORD_RESET_SUCCESS').length,
      suspiciousActivities: events.filter(e => e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED').length,
    };
  }, [dataToDisplay.recentEvents]);

  if (realTimeData.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải dữ liệu thời gian thực...</span>
      </div>
    );
  }

  if (realTimeData.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{realTimeData.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <SecurityHeader
        lastUpdated={lastUpdated}
        isConnected={dataToDisplay.isSupabaseConnected}
        isRealTimeEnabled={isRealTimeEnabled}
        isPaused={isPaused}
        onRealTimeToggle={handleRealTimeToggle}
        onPauseToggle={handlePauseToggle}
        onReset={handleReset}
      />
      <RealTimeMetricsCard metrics={metrics} isRealTimeEnabled={isRealTimeEnabled && !isPaused} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveActivityFeed
            events={dataToDisplay.recentEvents}
            isRealTimeEnabled={isRealTimeEnabled && !isPaused}
            isLoading={dataToDisplay.isLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <ThreatAnalysisCard data={dataToDisplay.threatTrends} />
        </div>
      </div>
    </div>
  );
}