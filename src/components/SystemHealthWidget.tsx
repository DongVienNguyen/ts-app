import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { healthCheckService } from '@/services/healthCheckService';

interface HealthSummary {
  overallHealth: number;
  services: { [key: string]: any };
  summary: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
  };
}

export function SystemHealthWidget() {
  const [healthSummary, setHealthSummary] = useState<HealthSummary>({
    overallHealth: 100,
    services: {},
    summary: { total: 0, online: 0, degraded: 0, offline: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadHealthSummary();
    
    // Update every 30 seconds
    const interval = setInterval(loadHealthSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthSummary = async () => {
    try {
      setIsLoading(true);
      const summary = await healthCheckService.getHealthSummary();
      setHealthSummary(summary);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading health summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    if (health >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadgeColor = (health: number) => {
    if (health >= 90) return 'bg-green-100 text-green-800';
    if (health >= 70) return 'bg-yellow-100 text-yellow-800';
    if (health >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'offline': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const serviceNames: { [key: string]: string } = {
    database: 'Cơ sở dữ liệu',
    email: 'Dịch vụ Email',
    push_notification: 'Push Notification',
    api: 'API Server'
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span>Tình trạng Hệ thống</span>
        </CardTitle>
        <Badge className={getHealthBadgeColor(healthSummary.overallHealth)}>
          {healthSummary.overallHealth.toFixed(0)}% Healthy
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Health Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tình trạng tổng thể:</span>
                <span className={`font-bold ${getHealthColor(healthSummary.overallHealth)}`}>
                  {healthSummary.overallHealth.toFixed(0)}%
                </span>
              </div>
              <Progress value={healthSummary.overallHealth} className="h-2" />
            </div>

            {/* Services Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Dịch vụ:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(healthSummary.services).map(([serviceName, service]) => (
                  <div key={serviceName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(service.status)}
                      <span className="text-xs font-medium">
                        {serviceNames[serviceName] || serviceName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {service.response_time_ms ? `${service.response_time_ms}ms` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="space-y-1">
                <div className="text-lg font-bold text-green-600">{healthSummary.summary.online}</div>
                <div className="text-xs text-gray-600">Online</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-yellow-600">{healthSummary.summary.degraded}</div>
                <div className="text-xs text-gray-600">Degraded</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-red-600">{healthSummary.summary.offline}</div>
                <div className="text-xs text-gray-600">Offline</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">{healthSummary.summary.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500 text-center">
              Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}