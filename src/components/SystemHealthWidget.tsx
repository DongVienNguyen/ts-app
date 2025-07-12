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
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Core System Health Metrics */}
            <SystemMetricsGrid health={health} />

            {/* System Alerts */}
            <SystemAlerts overallHealth={health.overall} />

            {/* Status Footer */}
            <SystemHealthFooter
              lastUpdated={lastUpdated}
              autoRefresh={autoRefresh}
              overallHealth={health.overall}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-6">
            {/* Performance Insights */}
            <PerformanceInsights performance={health.performance} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemHealthWidget;