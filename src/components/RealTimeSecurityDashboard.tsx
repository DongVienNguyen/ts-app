import { useState, useMemo } from 'react';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { SecurityHeader } from './security/SecurityHeader';
import { RealTimeMetricsCard } from './security/RealTimeMetricsCard';
import { LiveActivityFeed } from './security/LiveActivityFeed';
import { ThreatAnalysisCard } from './security/ThreatAnalysisCard';
import { ActiveUsersCard } from './security/ActiveUsersCard';
import { SystemOverviewCards } from './security/SystemOverviewCards'; // New import
import { SecurityAlerts } from './security/SecurityAlerts'; // New import
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSecureAuth } from '@/contexts/AuthContext';
import { SystemAlert, SecurityEvent } from '@/hooks/useRealTimeSecurityMonitoring'; // Import types

export function RealTimeSecurityDashboard() {
  const { user } = useSecureAuth();

  const {
    recentEvents,
    threatTrends,
    isSupabaseConnected,
    isLoading,
    error,
    logEvent,
    activeUsers,
    systemStatus,
    securityAlerts,
  } = useRealTimeSecurityMonitoring(user);

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
  const [isPaused, setIsPaused] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  
  // The snapshot will now store the specific data points, not the whole hook object
  const [snapshotData, setSnapshotData] = useState<{
    recentEvents: SecurityEvent[]; // Use SecurityEvent type
    threatTrends: typeof threatTrends;
    isSupabaseConnected: boolean;
    systemStatus: typeof systemStatus; // Include in snapshot
    securityAlerts: SystemAlert[]; // Use SystemAlert type
    activeUsers: number; // Added activeUsers to snapshot
  } | null>(null);

  // Determine which data to display based on real-time status and pause state
  const dataToDisplay = useMemo(() => {
    if (isRealTimeEnabled && !isPaused) {
      // Use live data
      return { recentEvents, threatTrends, isSupabaseConnected, isLoading, activeUsers, systemStatus, securityAlerts };
    } else {
      // Use snapshot data if available, otherwise fall back to live data
      return snapshotData 
        ? { ...snapshotData, isLoading: false } 
        : { recentEvents, threatTrends, isSupabaseConnected, isLoading, activeUsers, systemStatus, securityAlerts };
    }
  }, [isRealTimeEnabled, isPaused, snapshotData, recentEvents, threatTrends, isSupabaseConnected, isLoading, activeUsers, systemStatus, securityAlerts]);

  // Derive lastUpdated from the dataToDisplay.recentEvents
  const derivedLastUpdated = useMemo(() => {
    if (dataToDisplay.recentEvents && dataToDisplay.recentEvents.length > 0) {
      return new Date(dataToDisplay.recentEvents[0].created_at!); // Use created_at for timestamp, add non-null assertion
    }
    return null;
  }, [dataToDisplay.recentEvents]);

  const handleRealTimeToggle = (enabled: boolean) => {
    setIsRealTimeEnabled(enabled);
    if (!enabled) {
      setIsPaused(true);
      // Create a snapshot of the current data
      setSnapshotData({ recentEvents, threatTrends, isSupabaseConnected, systemStatus, securityAlerts, activeUsers }); // Include activeUsers
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
          setSnapshotData({ recentEvents, threatTrends, isSupabaseConnected, systemStatus, securityAlerts, activeUsers }); // Include activeUsers
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
      loginAttempts: events.filter(e => e.event_type === 'LOGIN_SUCCESS' || e.event_type === 'LOGIN_FAILED').length,
      successfulLogins: events.filter(e => e.event_type === 'LOGIN_SUCCESS').length,
      failedLogins: events.filter(e => e.event_type === 'LOGIN_FAILED').length,
      accountLocks: events.filter(e => e.event_type === 'ACCOUNT_LOCKED').length,
      passwordResets: events.filter(e => e.event_type === 'PASSWORD_RESET_SUCCESS').length,
      suspiciousActivities: events.filter(e => e.event_type === 'SUSPICIOUS_ACTIVITY' || e.event_type === 'RATE_LIMIT_EXCEEDED').length,
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
      <SystemOverviewCards systemStatus={dataToDisplay.systemStatus} isLoading={dataToDisplay.isLoading} /> {/* New row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RealTimeMetricsCard metrics={metrics} isRealTimeEnabled={isRealTimeEnabled && !isPaused} />
        <ActiveUsersCard activeUsers={dataToDisplay.activeUsers} isLoading={dataToDisplay.isLoading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveActivityFeed
            events={dataToDisplay.recentEvents}
            isRealTimeEnabled={isRealTimeEnabled && !isPaused}
            isLoading={dataToDisplay.isLoading}
          />
        </div>
        <div className="lg:col-span-1 space-y-4"> {/* Added space-y-4 for vertical spacing */}
          <ThreatAnalysisCard data={dataToDisplay.threatTrends} isLoading={dataToDisplay.isLoading} />
          <SecurityAlerts alerts={dataToDisplay.securityAlerts} isLoading={dataToDisplay.isLoading} /> {/* New card */}
        </div>
      </div>
    </div>
  );
}