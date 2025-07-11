import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useSecureAuth } from '@/contexts/AuthContext';
import {
  useSystemHealth,
  SystemHealthHeader,
  SystemMetricsGrid,
  SystemAlerts,
  PerformanceInsights,
  SystemHealthFooter
} from './system-health';

export const SystemHealthWidget: React.FC = () => {
  const { user } = useSecureAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
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
      <CardContent className="space-y-6">
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
      </CardContent>
    </Card>
  );
};

export default SystemHealthWidget;