import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

export function RealTimeSecurityMonitor() {
  const {
    stats,
    isLoading,
    error,
    canAccess,
    refreshData
  } = useSecurityMonitoring();

  if (!canAccess) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Chỉ admin mới có thể truy cập Security Monitor.
        </AlertDescription>
      </Alert>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{stats.loginAttempts}</div>
          <div className="text-sm text-gray-600">Login Attempts</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-2xl font-bold text-red-600">{stats.failedLogins}</div>
          <div className="text-sm text-gray-600">Failed Logins</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">{stats.suspiciousActivity}</div>
          <div className="text-sm text-gray-600">Suspicious Activity</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Events</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : stats.recentEvents.length > 0 ? (
          <div className="space-y-3">
            {stats.recentEvents.slice(0, 5).map((event, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{event.event_type}</span>
                    {event.username && <span className="text-sm text-gray-600 ml-2">{event.username}</span>}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent events</p>
        )}
      </div>
    </div>
  );
}