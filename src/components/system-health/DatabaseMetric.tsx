import React from 'react';
import { Database } from 'lucide-react';
import { DatabaseHealth } from './types';
import { getStatusIcon, formatResponseTime, formatUptime } from './utils';

interface DatabaseMetricProps {
  health: DatabaseHealth;
}

export const DatabaseMetric: React.FC<DatabaseMetricProps> = ({ health }) => {
  const StatusIcon = getStatusIcon(health.status);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Database</span>
        </div>
        <StatusIcon className="h-4 w-4" />
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div>Response: {formatResponseTime(health.responseTime || 0)}</div>
        <div>Uptime: {formatUptime(health.uptime || 0)}</div>
        <div>Connections: {health.connections}</div>
      </div>
    </div>
  );
};