import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/contexts/AuthContext';
import { useErrorMonitoringData } from '@/hooks/useErrorMonitoringData';
import { SystemStatus } from '@/utils/errorTracking';
import { PWATestPanel } from '@/components/PWATestPanel';
import PushNotificationTester from '@/components/PushNotificationTester';
import { VAPIDKeyTester } from '@/components/VAPIDKeyTester';
import { AdminEmailSettings } from '@/components/admin/AdminEmailSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ErrorMonitoring = () => {
  const { user } = useSecureAuth();
  const {
    errorStats,
    recentErrors,
    serviceHealth,
    isLoading,
    isRefreshingErrors,
    lastUpdated,
    refreshAll,
    refreshRecentErrors,
    getStatusColor,
    getSeverityColor
  } = useErrorMonitoringData();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertCircle className="w-4 h-4" />;
      case 'offline': return <XCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Show access denied message for non-admin users
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chỉ admin mới có thể truy cập trang Error Monitoring.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Error Monitoring</h1>
            <p className="text-gray-500">Monitor system errors and service health</p>
          </div>
          <Button
            onClick={refreshAll}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh All'}
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold text-gray-900">{errorStats.totalErrors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Errors</p>
                <p className="text-2xl font-bold text-gray-900">{errorStats.criticalErrors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{errorStats.resolvedErrors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">{errorStats.errorRate.toFixed(1)}/h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="errors" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="errors">Recent Errors</TabsTrigger>
            <TabsTrigger value="services">Service Health</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="pwa">PWA & Push</TabsTrigger>
            <TabsTrigger value="settings">Admin Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Errors</span>
                  <Button
                    onClick={refreshRecentErrors}
                    disabled={isRefreshingErrors}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingErrors ? 'animate-spin' : ''}`} />
                    {isRefreshingErrors ? 'Refreshing...' : 'Refresh Errors'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2">Loading errors...</span>
                  </div>
                ) : recentErrors.length > 0 ? (
                  <div className="space-y-3">
                    {recentErrors.slice(0, 20).map((error) => (
                      <div key={error.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getSeverityColor(error.severity || 'medium')}>
                                {(error.severity || 'medium').toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{error.error_type}</Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(error.created_at!).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                              {error.error_message}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {error.function_name && (
                                <span>Function: {error.function_name}</span>
                              )}
                              {error.user_id && (
                                <span>User: {error.user_id}</span>
                              )}
                              {error.ip_address && (
                                <span>IP: {error.ip_address}</span>
                              )}
                            </div>
                            {error.error_stack && (
                              <details className="mt-2">
                                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                  View Stack Trace
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                  {error.error_stack}
                                </pre>
                              </details>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant={error.status === 'resolved' ? 'default' : 'destructive'}>
                              {error.status || 'open'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No errors found</p>
                    <p className="text-sm">This is good news! Your system is running smoothly.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(serviceHealth).map(([service, status]) => (
                    <div key={service} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`text-lg ${getStatusColor((status as SystemStatus).status)}`}>
                            {getStatusIcon((status as SystemStatus).status)}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {service === 'pushNotification' ? 'Push Notification' : service}
                            </p>
                            <p className="text-sm text-gray-500">
                              Uptime: {(status as SystemStatus).uptime_percentage?.toFixed(1) || 0}%
                            </p>
                            {(status as SystemStatus).response_time_ms && (
                              <p className="text-sm text-gray-500">
                                Response: {(status as SystemStatus).response_time_ms}ms
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor((status as SystemStatus).status)}>
                          {(status as SystemStatus).status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Top Error Types */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Top Error Types</h4>
                  {errorStats.topErrorTypes.length > 0 ? (
                    <div className="space-y-2">
                      {errorStats.topErrorTypes.slice(0, 10).map((errorType) => (
                        <div key={errorType.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">{errorType.type}</span>
                          <span className="text-sm text-gray-600">{errorType.count} errors</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No error types to display</p>
                  )}
                </div>

                {/* Error Trend */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Error Trend (Last 7 Days)</h4>
                  {errorStats.errorTrend.length > 0 ? (
                    <div className="space-y-2">
                      {errorStats.errorTrend.map((day) => (
                        <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}
                          </span>
                          <span className="text-sm text-gray-600">{day.count} errors</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No trend data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pwa" className="space-y-6">
            <PWATestPanel />
            <PushNotificationTester />
            <VAPIDKeyTester />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminEmailSettings />
          </TabsContent>
        </Tabs>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdated?.toLocaleString('vi-VN') || 'Never'}
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            <div className="text-sm space-y-1">
              <div>Total Errors: {errorStats.totalErrors}</div>
              <div>Recent Errors Count: {recentErrors.length}</div>
              <div>Is Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Is Refreshing Errors: {isRefreshingErrors ? 'Yes' : 'No'}</div>
              <div>User Role: {user?.role}</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ErrorMonitoring;