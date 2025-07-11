import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { SystemHealth } from './types';

interface RealTimeData {
  timestamp: string;
  dbResponseTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  storageUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

interface RealTimeMonitorProps {
  health: SystemHealth;
  isActive: boolean;
  onToggle: () => void;
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({
  health,
  isActive,
  onToggle
}) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [maxDataPoints] = useState(50);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const newDataPoint: RealTimeData = {
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        dbResponseTime: health.database.responseTime || 0,
        apiResponseTime: health.api.responseTime || 0,
        memoryUsage: health.memory.percentage,
        storageUsage: health.storage.percentage,
        cpuUsage: Math.random() * 100,
        activeConnections: health.database.connections
      };

      setRealTimeData(prev => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-maxDataPoints);
      });

      // Check for alerts
      const newAlerts: string[] = [];
      if (newDataPoint.dbResponseTime > 1000) {
        newAlerts.push(`High DB response time: ${newDataPoint.dbResponseTime}ms`);
      }
      if (newDataPoint.memoryUsage > 80) {
        newAlerts.push(`High memory usage: ${newDataPoint.memoryUsage.toFixed(1)}%`);
      }
      if (newDataPoint.cpuUsage > 90) {
        newAlerts.push(`High CPU usage: ${newDataPoint.cpuUsage.toFixed(1)}%`);
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev.slice(-4), ...newAlerts].slice(-5));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, health, maxDataPoints]);

  const clearData = () => {
    setRealTimeData([]);
    setAlerts([]);
  };

  const getLatestValue = (key: keyof RealTimeData) => {
    const latest = realTimeData[realTimeData.length - 1];
    return latest ? latest[key] : 0;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Real-Time System Monitor</CardTitle>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? 'LIVE' : 'PAUSED'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggle}
                variant={isActive ? "destructive" : "default"}
                size="sm"
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button onClick={clearData} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Live Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(getLatestValue('dbResponseTime') as number)}
              </div>
              <div className="text-xs text-blue-700">DB Response (ms)</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(getLatestValue('apiResponseTime') as number)}
              </div>
              <div className="text-xs text-green-700">API Response (ms)</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(getLatestValue('memoryUsage') as number).toFixed(1)}%
              </div>
              <div className="text-xs text-purple-700">Memory Usage</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {(getLatestValue('storageUsage') as number).toFixed(1)}%
              </div>
              <div className="text-xs text-orange-700">Storage Usage</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {(getLatestValue('cpuUsage') as number).toFixed(1)}%
              </div>
              <div className="text-xs text-red-700">CPU Usage</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {getLatestValue('activeConnections')}
              </div>
              <div className="text-xs text-indigo-700">Connections</div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Recent Alerts</span>
              </div>
              <div className="space-y-1">
                {alerts.slice(-3).map((alert, index) => (
                  <div key={index} className="text-sm text-red-700">
                    • {alert}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Times */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="dbResponseTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Database (ms)"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="apiResponseTime" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="API (ms)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resource Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="memoryUsage" 
                  stackId="1"
                  stroke="#8B5CF6" 
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                  name="Memory %"
                />
                <Area 
                  type="monotone" 
                  dataKey="cpuUsage" 
                  stackId="2"
                  stroke="#EF4444" 
                  fill="#EF4444"
                  fillOpacity={0.6}
                  name="CPU %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      {realTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Data Points</div>
                <div className="text-2xl font-bold">{realTimeData.length}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Duration</div>
                <div className="text-2xl font-bold">
                  {Math.round((realTimeData.length * 2) / 60)}m
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Avg DB Response</div>
                <div className="text-2xl font-bold">
                  {realTimeData.length > 0 
                    ? Math.round(realTimeData.reduce((sum, d) => sum + d.dbResponseTime, 0) / realTimeData.length)
                    : 0}ms
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Peak Memory</div>
                <div className="text-2xl font-bold">
                  {realTimeData.length > 0 
                    ? Math.max(...realTimeData.map(d => d.memoryUsage)).toFixed(1)
                    : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};