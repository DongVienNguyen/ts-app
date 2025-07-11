import React from 'react';
import { Server } from 'lucide-react';
import { ApiHealth } from './types';
import { getStatusIcon, formatResponseTime, formatUptime } from './utils';

interface ApiMetricProps {
  health: ApiHealth;
}

export const ApiMetric: React.FC<ApiMetricProps> = ({ health }) => {
  const StatusIcon = getStatusIcon(health.status);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">API</span>
        </div>
        <StatusIcon className="h-4 w-4" />
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div>Response: {formatResponseTime(health.responseTime || 0)}</div>
        <div>Uptime: {formatUptime(health.uptime || 0)}</div>
        <div>Req/min: {health.requestsPerMinute}</div>
      </div>
    </div>
  );
};