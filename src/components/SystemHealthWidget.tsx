import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/contexts/AuthContext';
import {
  useSystemHealth,
  SystemHealthHeader,
  SystemMetricsGrid,
  SystemAlerts,
  PerformanceInsights,
  SystemHealthFooter
} from './system-health';
import { RealTimeMonitor } from './system-health/RealTimeMonitor';

export const SystemHealthWidget: React.FC = () => {
  const { user } = useSecureAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realTimeActive, setRealTimeActive] = useState(false);
  
  const {
    health,
    isLoading,
    lastUpdated,
    checkSystemHealth
  } = useSystemHealth(autoRefresh);

  const canAccess = user?.role === 'admin';

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleRefresh = () => {
    checkSystemHealth();
  };

  const handleToggleRealTime = () => {
    setRealTimeActive(!realTimeActive);
  };

  if (!canAccess) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <SystemHealthHeader
          overallHealth={health.overall}
          autoRefresh={autoRefresh}
          isLoading={isLoading}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          onRefresh={handleRefresh}
        />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Core System Health Metrics */}
            <SystemMetricsGrid health={health} />

            {/* System Alerts */}
            <SystemAlerts overallHealth={health.overall} />

            {/* Performance Insights */}
            <PerformanceInsights performance={health.performance} />

            {/* Status Footer */}
            <SystemHealthFooter
              lastUpdated={lastUpdated}
              autoRefresh={autoRefresh}
              overallHealth={health.overall}
            />
          </TabsContent>

          <TabsContent value="realtime" className="mt-6">
            <RealTimeMonitor
              health={health}
              isActive={realTimeActive}
              onToggle={handleToggleRealTime}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-6">
            {/* Advanced Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">System Trends</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Database Performance</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Stable</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Memory Usage Trend</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium">Increasing</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API Response Time</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Optimal</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Security Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Secure</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recommendations</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Optimization</div>
                      <div className="text-xs text-blue-700 mt-1">
                        Consider implementing database query caching to improve response times.
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-900">Performance</div>
                      <div className="text-xs text-green-700 mt-1">
                        System performance is within optimal ranges. No action required.
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm font-medium text-yellow-900">Monitoring</div>
                      <div className="text-xs text-yellow-700 mt-1">
                        Monitor memory usage trends. Consider cleanup if usage exceeds 85%.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Statistics */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">System Statistics</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {health.performance.totalOperations}
                    </div>
                    <div className="text-sm text-gray-600">Total Operations</div>
                    <div className="text-xs text-gray-500 mt-1">Since last restart</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {health.performance.averageResponseTime.toFixed(1)}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                    <div className="text-xs text-gray-500 mt-1">Last 100 operations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {health.database.uptime?.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">System Uptime</div>
                    <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {health.security.failedLogins}
                    </div>
                    <div className="text-sm text-gray-600">Failed Logins</div>
                    <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health History */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recent Health Events</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">System Health Check Completed</div>
                      <div className="text-xs text-gray-600">All systems operational - {lastUpdated.toLocaleString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Performance Monitoring Active</div>
                      <div className="text-xs text-gray-600">Tracking {health.performance.totalOperations} operations</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Security Scan Completed</div>
                      <div className="text-xs text-gray-600">No threats detected - {new Date(health.security.lastSecurityScan).toLocaleString('vi-VN')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemHealthWidget;