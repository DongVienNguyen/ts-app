import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Bell, 
  Settings, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import { useSecureAuth } from '@/contexts/AuthContext';
import { 
  useSystemHealth,
  SystemHealthHeader,
  SystemMetricsGrid,
  SystemAlerts,
  PerformanceInsights,
  SystemHealthFooter,
  RealTimeMonitor
} from './index';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { systemHealthAlertService, Alert as SystemAlert } from '@/services/systemHealthAlertService';

export const SystemHealthDashboard: React.FC = () => {
  const { user } = useSecureAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realTimeActive, setRealTimeActive] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([]);
  const [alertStats, setAlertStats] = useState({
    totalRules: 0,
    enabledRules: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    acknowledgedAlerts: 0
  });

  const {
    health,
    isLoading,
    lastUpdated,
    checkSystemHealth
  } = useSystemHealth(autoRefresh);

  const canAccess = user?.role === 'admin';

  useEffect(() => {
    if (canAccess) {
      loadAlerts();
      const interval = setInterval(loadAlerts, 30000); // Check alerts every 30 seconds
      return () => clearInterval(interval);
    }
  }, [canAccess]);

  useEffect(() => {
    if (canAccess) {
      evaluateHealthAlerts();
    }
  }, [health, canAccess]);

  const loadAlerts = () => {
    const alerts = systemHealthAlertService.getActiveAlerts();
    const stats = systemHealthAlertService.getAlertStats();
    setActiveAlerts(alerts);
    setAlertStats(stats);
  };

  const evaluateHealthAlerts = async () => {
    try {
      const newAlerts = await systemHealthAlertService.evaluateAlerts(health);
      if (newAlerts.length > 0) {
        console.log(`🚨 Generated ${newAlerts.length} new alerts`);
        loadAlerts(); // Refresh alerts display
      }
    } catch (error) {
      console.error('Error evaluating health alerts:', error);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    const success = await systemHealthAlertService.acknowledgeAlert(alertId, user?.username || 'admin');
    if (success) {
      loadAlerts();
    }
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleRefresh = () => {
    checkSystemHealth();
    loadAlerts();
  };

  const handleToggleRealTime = () => {
    setRealTimeActive(!realTimeActive);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Chỉ admin mới có thể truy cập System Health Dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <SystemHealthHeader
            overallHealth={health.overall}
            autoRefresh={autoRefresh}
            isLoading={isLoading}
            onToggleAutoRefresh={handleToggleAutoRefresh}
            onRefresh={handleRefresh}
          />
        </CardHeader>
      </Card>

      {/* Alert Summary */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active System Alerts ({activeAlerts.length})
              </CardTitle>
              <Badge variant="destructive">
                {alertStats.criticalAlerts} Critical
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium text-red-900">{alert.ruleName}</span>
                    </div>
                    <div className="text-sm text-red-700">{alert.message}</div>
                    <div className="text-xs text-red-600 mt-1">
                      {new Date(alert.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
              {activeAlerts.length > 3 && (
                <div className="text-center text-sm text-red-600">
                  ... and {activeAlerts.length - 3} more alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{health.overall === 'healthy' ? '100' : health.overall === 'warning' ? '75' : '25'}%</p>
                <p className="text-sm text-gray-600">System Health</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(health.performance.averageResponseTime)}ms</p>
                <p className="text-sm text-gray-600">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{health.database.connections}</p>
                <p className="text-sm text-gray-600">Active Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bell className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{alertStats.activeAlerts}</p>
                <p className="text-sm text-gray-600">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{health.security.failedLogins}</p>
                <p className="text-sm text-gray-600">Failed Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <SystemMetricsGrid health={health} />
          <SystemAlerts overallHealth={health.overall} />
          <PerformanceInsights performance={health.performance} />
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

        <TabsContent value="analytics" className="mt-6">
          <PerformanceAnalytics
            health={health}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6 mt-6">
          {/* Alert Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{alertStats.totalRules}</div>
                <div className="text-sm text-gray-600">Total Rules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{alertStats.enabledRules}</div>
                <div className="text-sm text-gray-600">Enabled Rules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{alertStats.activeAlerts}</div>
                <div className="text-sm text-gray-600">Active Alerts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{alertStats.criticalAlerts}</div>
                <div className="text-sm text-gray-600">Critical Alerts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{alertStats.acknowledgedAlerts}</div>
                <div className="text-sm text-gray-600">Acknowledged</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlerts.length > 0 ? (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{alert.ruleName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(alert.timestamp).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{alert.message}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Metric: {alert.metric} | Current: {alert.currentValue} | Threshold: {alert.threshold}
                        </div>
                        <Button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          variant="outline"
                          size="sm"
                        >
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Health Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Refresh</div>
                    <div className="text-sm text-gray-600">Automatically refresh health data</div>
                  </div>
                  <Badge variant={autoRefresh ? "default" : "secondary"}>
                    {autoRefresh ? 'ON' : 'OFF'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Real-time Monitoring</div>
                    <div className="text-sm text-gray-600">Live system monitoring with charts</div>
                  </div>
                  <Badge variant={realTimeActive ? "default" : "secondary"}>
                    {realTimeActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Alert Rules</div>
                    <div className="text-sm text-gray-600">Number of enabled alert rules</div>
                  </div>
                  <Badge variant="outline">
                    {alertStats.enabledRules} / {alertStats.totalRules}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Last Health Check</div>
                  <div>{lastUpdated.toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">System Uptime</div>
                  <div>{health.database.uptime?.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Performance Operations</div>
                  <div>{health.performance.totalOperations}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Security Scan</div>
                  <div>{new Date(health.security.lastSecurityScan).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealthDashboard;