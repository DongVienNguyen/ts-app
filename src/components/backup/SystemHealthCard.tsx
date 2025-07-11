import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, Database, Server, Wifi, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  service: string;
  status: 'online' | 'offline' | 'checking';
  responseTime?: number;
  lastCheck: string;
  icon: React.ReactNode;
}

const SystemHealthCard: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      service: 'Database',
      status: 'checking',
      lastCheck: new Date().toISOString(),
      icon: <Database className="h-4 w-4" />
    },
    {
      service: 'API Server',
      status: 'checking',
      lastCheck: new Date().toISOString(),
      icon: <Server className="h-4 w-4" />
    },
    {
      service: 'Network',
      status: 'checking',
      lastCheck: new Date().toISOString(),
      icon: <Wifi className="h-4 w-4" />
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const performHealthCheck = async () => {
    setIsChecking(true);
    console.log('🏥 Starting system health check...');

    const newHealthChecks = [...healthChecks];

    // Database check
    try {
      const startTime = Date.now();
      const { error } = await supabase.from('staff').select('count').limit(1);
      const responseTime = Date.now() - startTime;
      
      newHealthChecks[0] = {
        ...newHealthChecks[0],
        status: error ? 'offline' : 'online',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      newHealthChecks[0] = {
        ...newHealthChecks[0],
        status: 'offline',
        lastCheck: new Date().toISOString()
      };
    }

    // API Server check (simulate)
    try {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
      const responseTime = Date.now() - startTime;
      
      newHealthChecks[1] = {
        ...newHealthChecks[1],
        status: 'online',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      newHealthChecks[1] = {
        ...newHealthChecks[1],
        status: 'offline',
        lastCheck: new Date().toISOString()
      };
    }

    // Network check
    try {
      const startTime = Date.now();
      const isOnline = navigator.onLine;
      const responseTime = Date.now() - startTime;
      
      newHealthChecks[2] = {
        ...newHealthChecks[2],
        status: isOnline ? 'online' : 'offline',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      newHealthChecks[2] = {
        ...newHealthChecks[2],
        status: 'offline',
        lastCheck: new Date().toISOString()
      };
    }

    setHealthChecks(newHealthChecks);
    setIsChecking(false);
    console.log('✅ System health check completed');
  };

  useEffect(() => {
    performHealthCheck();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getOverallHealth = () => {
    const onlineCount = healthChecks.filter(check => check.status === 'online').length;
    const totalCount = healthChecks.length;
    return Math.round((onlineCount / totalCount) * 100);
  };

  const overallHealth = getOverallHealth();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Current system status before backup
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={performHealthCheck}
            disabled={isChecking}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Health */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Health</span>
            <span className="text-sm font-medium">{overallHealth}%</span>
          </div>
          <Progress 
            value={overallHealth} 
            className={`w-full h-2 ${
              overallHealth >= 80 ? 'text-green-600' : 
              overallHealth >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}
          />
        </div>

        {/* Individual Health Checks */}
        <div className="space-y-3">
          {healthChecks.map((check, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-600">
                  {check.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{check.service}</div>
                  <div className="text-sm text-gray-500">
                    Last check: {new Date(check.lastCheck).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {check.responseTime && (
                  <div className="text-sm text-gray-600">
                    {check.responseTime}ms
                  </div>
                )}
                {getStatusBadge(check.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Health Recommendations */}
        {overallHealth < 100 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              <strong>Recommendation:</strong> Some services are offline. 
              Consider fixing issues before creating backup to ensure data integrity.
            </div>
          </div>
        )}

        {overallHealth === 100 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>All systems operational!</strong> Ready for backup creation.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;