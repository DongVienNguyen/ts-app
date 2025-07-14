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

export function RealTimeSecurityDashboard() {
  const { user } = useSecureAuth();
  const {
    recentEvents,
    threatTrends,
    isSupabaseConnected,
    isLoading,
    isRefreshing,
    error,
    activeUsers,
    systemStatus,
    securityAlerts,
    refreshEvents,
    forceUpdateCounter,
    acknowledgeSystemAlert, // Add acknowledgeSystemAlert here
  } = useRealTimeSecurityMonitoring(user);

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
      <Alert variant={isSupabaseConnected ? "default" : "destructive"}>
        {isSupabaseConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <AlertDescription>
          {isSupabaseConnected 
            ? "Kết nối real-time đang hoạt động bình thường." 
            : "Mất kết nối real-time. Đang cố gắng kết nối lại..."}
          {error && ` Lỗi: ${error}`}
        </AlertDescription>
      </Alert>

      <SystemOverviewCards 
        systemStatus={systemStatus}
        activeUsers={activeUsers}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <LiveActivityFeed 
            events={recentEvents || []}
            isRealTimeEnabled={isSupabaseConnected}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={refreshEvents}
            forceUpdateCounter={forceUpdateCounter}
          />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <RealTimeMetricsCard 
            events={recentEvents || []}
            isLoading={isLoading}
            title="Số liệu thời gian thực (1 giờ qua)"
            timeframeMinutes={60}
          />
          <RealTimeMetricsCard 
            events={recentEvents || []}
            isLoading={isLoading}
            title="Số liệu tổng hợp (24 giờ qua)"
            timeframeMinutes={1440}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ThreatAnalysisCard 
            threatTrends={threatTrends || []}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <ActiveUsersCard 
            activeUsers={activeUsers}
            isLoading={isLoading}
          />
        </div>
      </div>

      <SecurityAlerts 
        alerts={securityAlerts || []}
        isLoading={isLoading}
        onAcknowledge={acknowledgeSystemAlert}
      />
    </div>
  );
}