import { useSecureAuth } from '@/contexts/AuthContext';
import { useRealTimeSecurityMonitoring } from '@/hooks/useRealTimeSecurityMonitoring';
import { LiveActivityFeed } from '@/components/security/LiveActivityFeed';
import { RealTimeMetricsCard } from '@/components/security/RealTimeMetricsCard';
import { ThreatAnalysisCard } from '@/components/security/ThreatAnalysisCard';
import { ActiveUsersCard } from '@/components/security/ActiveUsersCard';
import { SystemOverviewCards } from '@/components/security/SystemOverviewCards';
import { SecurityAlerts } from '@/components/security/SecurityAlerts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function RealTimeSecurityDashboard() {
  const { user } = useSecureAuth();
  const {
    recentEvents,
    threatTrends,
    isSupabaseConnected,
    isLoading,
    error,
    activeUsers,
    systemStatus,
    securityAlerts,
  } = useRealTimeSecurityMonitoring(user);

  const [refreshKey, setRefreshKey] = useState(0);

  // Debug log để kiểm tra dữ liệu từ hook
  useEffect(() => {
    console.log('🔍 [RealTimeSecurityDashboard] Hook data:', {
      eventsCount: recentEvents?.length || 0,
      isConnected: isSupabaseConnected,
      isLoading,
      error,
      refreshKey
    });
  }, [recentEvents, isSupabaseConnected, isLoading, error, refreshKey]);

  const handleRefresh = () => {
    console.log('🔄 [RealTimeSecurityDashboard] Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
    // Force a re-render by updating a state
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Chỉ admin mới có thể truy cập dashboard real-time.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert variant={isSupabaseConnected ? "default" : "destructive"}>
        {isSupabaseConnected ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertDescription>
          {isSupabaseConnected 
            ? "Kết nối real-time đang hoạt động bình thường." 
            : "Mất kết nối real-time. Đang cố gắng kết nối lại..."}
          {error && ` Lỗi: ${error}`}
        </AlertDescription>
      </Alert>

      {/* System Overview Cards */}
      <SystemOverviewCards 
        systemStatus={systemStatus}
        activeUsers={activeUsers}
        isLoading={isLoading}
      />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Activity Feed */}
        <div className="lg:col-span-1">
          <LiveActivityFeed 
            events={recentEvents || []}
            isRealTimeEnabled={isSupabaseConnected}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Real-time Metrics */}
        <div className="lg:col-span-1">
          <RealTimeMetricsCard 
            events={recentEvents || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Analysis */}
        <div className="lg:col-span-2">
          <ThreatAnalysisCard 
            threatTrends={threatTrends || []}
            isLoading={isLoading}
          />
        </div>

        {/* Active Users */}
        <div className="lg:col-span-1">
          <ActiveUsersCard 
            activeUsers={activeUsers}
            recentEvents={recentEvents || []}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Security Alerts */}
      <SecurityAlerts 
        alerts={securityAlerts || []}
        isLoading={isLoading}
      />

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-sm space-y-1">
            <div>Events Count: {recentEvents?.length || 0}</div>
            <div>Is Connected: {isSupabaseConnected ? 'Yes' : 'No'}</div>
            <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
            <div>Refresh Key: {refreshKey}</div>
            <div>User Role: {user?.role}</div>
          </div>
        </div>
      )}
    </div>
  );
}