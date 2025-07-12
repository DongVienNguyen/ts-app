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
  // Initialize snapshotData to null, it will be set when needed
  const [snapshotData, setSnapshotData] = useState<typeof realTimeData | null>(null);

  // Determine which data to display based on real-time status and pause state
  const dataToDisplay = useMemo(() => {
    if (isRealTimeEnabled && !isPaused) {
      return realTimeData;
    } else {
      // If paused or real-time disabled, use the snapshot.
      // If no snapshot has been taken yet (snapshotData is null),
      // we should still display the current realTimeData as a fallback.
      return snapshotData || realTimeData;
    }
  }, [isRealTimeEnabled, isPaused, snapshotData, realTimeData]);

  // Derive lastUpdated from the dataToDisplay.recentEvents
  const derivedLastUpdated = useMemo(() => {
    if (dataToDisplay.recentEvents && dataToDisplay.recentEvents.length > 0) {
      // Get the timestamp of the most recent event
      return new Date(dataToDisplay.recentEvents[0].timestamp);
    }
    // If no events, or not real-time enabled, return null
    return null;
  }, [dataToDisplay.recentEvents]);

  const handleRealTimeToggle = (enabled: boolean) => {
    setIsRealTimeEnabled(enabled);
    if (!enabled) {
      setIsPaused(true); // If real-time is off, it's effectively paused
      setSnapshotData(realTimeData); // Capture snapshot when real-time is turned off
    } else {
      setIsPaused(false); // Allow live updates
      setSnapshotData(null); // Clear snapshot when real-time is re-enabled
    }
  };

  const handlePauseToggle = () => {
    if (isRealTimeEnabled) { // Only pause if real-time is enabled
      setIsPaused(prev => {
        const newPausedState = !prev;
        if (newPausedState) { // If transitioning to paused
          setSnapshotData(realTimeData); // Capture snapshot
        } else { // If transitioning to unpaused
          setSnapshotData(null); // Clear snapshot when unpaused
        }
        return newPausedState;
      });
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
        lastUpdated={derivedLastUpdated}
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