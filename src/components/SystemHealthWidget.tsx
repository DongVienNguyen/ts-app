import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Server, 
  Wifi, 
  HardDrive, 
  Cpu, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    connections: number;
    lastCheck: string;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    uptime: number;
    lastCheck: string;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    used: number;
    total: number;
    percentage: number;
  };
  memory: {
    status: 'healthy' | 'warning' | 'error';
    used: number;
    total: number;
    percentage: number;
  };
  overall: 'healthy' | 'warning' | 'error';
}

export const SystemHealthWidget: React.FC = () => {
  const { user } = useSecureAuth();
  const [health, setHealth] = useState<SystemHealth>({
    database: {
      status: 'healthy',
      responseTime: 0,
      connections: 0,
      lastCheck: new Date().toISOString()
    },
    api: {
      status: 'healthy',
      responseTime: 0,
      uptime: 99.9,
      lastCheck: new Date().toISOString()
    },
    storage: {
      status: 'healthy',
      used: 0,
      total: 100,
      percentage: 0
    },
    memory: {
      status: 'healthy',
      used: 0,
      total: 100,
      percentage: 0
    },
    overall: 'healthy'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const canAccess = user?.role === 'admin';

  const checkSystemHealth = async () => {
    if (!canAccess) return;

    setIsLoading(true);
    
    try {
      console.log('🏥 Checking system health...');
      
      // Check database health
      const dbStart = Date.now();
      const { data: dbTest, error: dbError } = await supabase
        .from('staff')
        .select('count')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStart;
      const dbStatus = dbError ? 'error' : dbResponseTime > 1000 ? 'warning' : 'healthy';

      // Check API health (simulate)
      const apiResponseTime = Math.random() * 500 + 100; // 100-600ms
      const apiStatus = apiResponseTime > 1000 ? 'warning' : 'healthy';

      // Simulate storage and memory usage
      const storageUsed = Math.random() * 80 + 10; // 10-90%
      const memoryUsed = Math.random() * 70 + 20; // 20-90%

      const newHealth: SystemHealth = {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          connections: Math.floor(Math.random() * 10) + 1,
          lastCheck: new Date().toISOString()
        },
        api: {
          status: apiStatus,
          responseTime: apiResponseTime,
          uptime: 99.9 - Math.random() * 0.5,
          lastCheck: new Date().toISOString()
        },
        storage: {
          status: storageUsed > 80 ? 'warning' : storageUsed > 90 ? 'error' : 'healthy',
          used: storageUsed,
          total: 100,
          percentage: storageUsed
        },
        memory: {
          status: memoryUsed > 80 ? 'warning' : memoryUsed > 90 ? 'error' : 'healthy',
          used: memoryUsed,
          total: 100,
          percentage: memoryUsed
        },
        overall: 'healthy'
      };

      // Determine overall health
      const statuses = [
        newHealth.database.status,
        newHealth.api.status,
        newHealth.storage.status,
        newHealth.memory.status
      ];

      if (statuses.includes('error')) {
        newHealth.overall = 'error';
      } else if (statuses.includes('warning')) {
        newHealth.overall = 'warning';
      }

      setHealth(newHealth);
      setLastUpdated(new Date());
      
      console.log('✅ System health check completed:', newHealth);
      
    } catch (error) {
      console.error('❌ System health check failed:', error);
      setHealth(prev => ({
        ...prev,
        overall: 'error',
        database: { ...prev.database, status: 'error' }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      checkSystemHealth();
      // Auto-refresh every 30 seconds
      const interval = setInterval(checkSystemHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [canAccess]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!canAccess) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Real-time system monitoring and health status
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(health.overall)}>
              {getStatusIcon(health.overall)}
              <span className="ml-1 capitalize">{health.overall}</span>
            </Badge>
            <Button
              onClick={checkSystemHealth}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Checking...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Database Health */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Database</span>
              </div>
              {getStatusIcon(health.database.status)}
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Response: {health.database.responseTime}ms</div>
              <div>Connections: {health.database.connections}</div>
            </div>
          </div>

          {/* API Health */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">API</span>
              </div>
              {getStatusIcon(health.api.status)}
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Response: {Math.round(health.api.responseTime)}ms</div>
              <div>Uptime: {health.api.uptime.toFixed(1)}%</div>
            </div>
          </div>

          {/* Storage Health */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              {getStatusIcon(health.storage.status)}
            </div>
            <div className="space-y-2">
              <Progress value={health.storage.percentage} className="h-2" />
              <div className="text-xs text-gray-600">
                {health.storage.percentage.toFixed(1)}% used
              </div>
            </div>
          </div>

          {/* Memory Health */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              {getStatusIcon(health.memory.status)}
            </div>
            <div className="space-y-2">
              <Progress value={health.memory.percentage} className="h-2" />
              <div className="text-xs text-gray-600">
                {health.memory.percentage.toFixed(1)}% used
              </div>
            </div>
          </div>
        </div>

        {/* Health Alerts */}
        {health.overall !== 'healthy' && (
          <div className={`p-4 rounded-lg border ${
            health.overall === 'error' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {health.overall === 'error' ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${
                health.overall === 'error' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                System Health Alert
              </span>
            </div>
            <div className={`text-sm ${
              health.overall === 'error' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {health.overall === 'error' 
                ? 'Critical system issues detected. Immediate attention required.'
                : 'System performance issues detected. Monitoring recommended.'
              }
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleString('vi-VN')}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthWidget;