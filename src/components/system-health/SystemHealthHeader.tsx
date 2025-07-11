import React from 'react';
import { Activity, Clock, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { getStatusIcon, getStatusColor } from './utils';

interface SystemHealthHeaderProps {
  overallHealth: 'healthy' | 'warning' | 'error';
  autoRefresh: boolean;
  isLoading: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
}

export const SystemHealthHeader: React.FC<SystemHealthHeaderProps> = ({
  overallHealth,
  autoRefresh,
  isLoading,
  onToggleAutoRefresh,
  onRefresh
}) => {
  const StatusIcon = getStatusIcon(overallHealth);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        <div>
          <CardTitle>System Health Monitor</CardTitle>
          <CardDescription>
            Real-time comprehensive system monitoring and health analytics
          </CardDescription>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(overallHealth)}>
          <StatusIcon className="h-4 w-4" />
          <span className="ml-1 capitalize">{overallHealth}</span>
        </Badge>
        <Button
          onClick={onToggleAutoRefresh}
          variant={autoRefresh ? "default" : "outline"}
          size="sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          Auto
        </Button>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Checking...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
};