import { useState, useMemo } from 'react';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { SecurityHeader } from './security/SecurityHeader';
import { RealTimeMetricsCard } from './security/RealTimeMetricsCard';
import { LiveActivityFeed } from './security/LiveActivityFeed';
import { ThreatAnalysisCard } from './security/ThreatAnalysisCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSecureAuth } from '@/contexts/AuthContext';

export function RealTimeSecurityDashboard() {
  const { user } = useSecureAuth();

  // Add role check here
  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Truy cập bị từ chối</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bạn không có quyền xem trang này. Chức năng giám sát bảo mật chỉ dành cho quản trị viên.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Destructure the hook's return value to get stable references to arrays/values
  const {
    recentEvents,
    threatTrends,
    isSupabaseConnected,
    isLoading,
    error,
    logEvent,
  } = useRealTimeSecurityMonitoring();

  const [isPaused, setIsPaused] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  
  // The snapshot will now store the specific data points, not the whole hook object
  const [snapshotData, setSnapshotData] = useState<{
    recentEvents: typeof recentEvents;
    threatTrends: typeof threatTrends;
    isSupabaseConnected: boolean;
  } | null>(null);

  // Determine which data to display based on real-time status and pause state
  const dataToDisplay = useMemo(() => {
    if (isRealTimeEnabled && !isPaused) {
      // Use live data
      return { recentEvents, threatTrends, isSupabaseConnected, isLoading };
    } else {
      // Use snapshot data if available, otherwise fall back to live data
      return snapshotData 
        ? { ...snapshotData, isLoading: false } 
        : { recentEvents, threatTrends, isSupabaseConnected, isLoading };
    }
  }, [isRealTimeEnabled, isPaused, snapshotData, recentEvents, threatTrends, isSupabaseConnected, isLoading]);

  // Derive lastUpdated from the dataToDisplay.recentEvents
  const derivedLastUpdated = useMemo(() => {
    if (dataToDisplay.recentEvents && dataToDisplay.recentEvents.length > 0) {
      return new Date(dataToDisplay.recentEvents[0].timestamp);
    }
    return null;
  }, [dataToDisplay.recentEvents]);

  const handleRealTimeToggle = (enabled: boolean) => {
    setIsRealTimeEnabled(enabled);
    if (!enabled) {
      setIsPaused(true);
      // Create a snapshot of the current data
      setSnapshotData({ recentEvents, threatTrends, isSupabaseConnected });
    } else {
      setIsPaused(false);
      setSnapshotData(null); // Clear snapshot
    }
  };

  const handlePauseToggle = () => {
    if (isRealTimeEnabled) {
      setIsPaused(prev => {
        const newPausedState = !prev;
        if (newPausedState) {
          // Create a snapshot when pausing
          setSnapshotData({ recentEvents, threatTrends, isSupabaseConnected });
        } else {
          // Clear snapshot when resuming
          setSnapshotData(null);
        }
        return newPausedState;
      });
    }
  };

  const handleReset = () => {
    logEvent('METRICS_RESET', { resetBy: user?.username || 'unknown' });
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

  if (isLoading && !snapshotData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải dữ liệu thời gian thực...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
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
          <ThreatAnalysisCard data={dataToDisplay.threatTrends} isLoading={dataToDisplay.isLoading} />
        </div>
      </div>
    </div>
  );
}