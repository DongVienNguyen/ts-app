import React from 'react';
import { Shield } from 'lucide-react';
import { SecurityHealth } from './types';
import { getStatusIcon } from './utils';

interface SecurityMetricProps {
  health: SecurityHealth;
}

export const SecurityMetric: React.FC<SecurityMetricProps> = ({ health }) => {
  const StatusIcon = getStatusIcon(health.status);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium">Security</span>
        </div>
        <StatusIcon className="h-4 w-4" />
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div>Threats: {health.activeThreats}</div>
        <div>Failed: {health.failedLogins}</div>
        <div>Scan: OK</div>
      </div>
    </div>
  );
};