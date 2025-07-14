import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Users, Activity, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/contexts/AuthContext';
import { useUsageData } from '@/hooks/useUsageData';

const UsageMonitoring = () => {
  const { user } = useSecureAuth();
  const {
    usageOverview,
    deviceStats,
    browserStats,
    timeRangeData,
    selectedTimeRange,
    isLoading,
    lastUpdated,
    setSelectedTimeRange,
    refreshData,
    formatDuration
  } = useUsageData();

  // Show access denied message for non-admin users
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Chỉ admin mới có thể truy cập trang Usage Monitoring.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Monitoring</h1>
          <p className="text-gray-500">Monitor user activity and system usage</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button
            onClick={refreshData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{usageOverview.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">{usageOverview.uniqueUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(usageOverview.averageSessionDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{usageOverview.totalPageViews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="browsers">Browsers</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Users */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users (24h)</span>
                  <span className="text-lg font-semibold text-green-600">{usageOverview.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <span className="text-lg font-semibold text-orange-600">{usageOverview.bounceRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Session Duration</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatDuration(usageOverview.averageSessionDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="text-lg font-semibold text-gray-900">{usageOverview.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unique Users</span>
                  <span className="text-lg font-semibold text-gray-900">{usageOverview.uniqueUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Page Views</span>
                  <span className="text-lg font-semibold text-gray-900">{usageOverview.totalPageViews}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Device Usage</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2">Loading device stats...</span>
              </div>
            ) : Object.keys(deviceStats).length > 0 && Object.values(deviceStats).some(v => v > 0) ? (
              <div className="space-y-4">
                {Object.entries(deviceStats)
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 capitalize">{device}</span>
                    <span className="text-sm text-gray-600">{count} sessions</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No device data available</p>
                <p className="text-sm">Device information will appear here when users access the system.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="browsers" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Browser Usage</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2">Loading browser stats...</span>
              </div>
            ) : Object.keys(browserStats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(browserStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{browser}</span>
                    <span className="text-sm text-gray-600">{count} sessions</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No browser data available</p>
                <p className="text-sm">Browser information will appear here when users access the system.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Trends</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2">Loading trends...</span>
              </div>
            ) : timeRangeData.daily.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Daily Usage</h4>
                {timeRangeData.daily.slice(-14).map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{day.sessions} sessions</div>
                      <div className="text-xs text-gray-500">{day.users} users</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No trend data available</p>
                <p className="text-sm">Usage trends will appear here as users interact with the system.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString('vi-VN')}
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-sm space-y-1">
            <div>Total Sessions: {usageOverview.totalSessions}</div>
            <div>Unique Users: {usageOverview.uniqueUsers}</div>
            <div>Device Stats: {JSON.stringify(deviceStats)}</div>
            <div>Browser Stats Count: {Object.keys(browserStats).length}</div>
            <div>Daily Trends Count: {timeRangeData.daily.length}</div>
            <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Selected Time Range: {selectedTimeRange}</div>
            <div>User Role: {user?.role}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageMonitoring;