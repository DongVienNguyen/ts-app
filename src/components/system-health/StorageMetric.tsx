import React from 'react';
import { HardDrive } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { StorageHealth } from './types';
import { getStatusIcon, formatPercentage, formatGrowth } from './utils';

interface StorageMetricProps {
  health: StorageHealth;
}

export const StorageMetric: React.FC<StorageMetricProps> = ({ health }) => {
  const StatusIcon = getStatusIcon(health.status);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">Storage</span>
        </div>
        <StatusIcon className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <Progress value={health.percentage} className="h-2" />
        <div className="text-xs text-gray-600">
          {formatPercentage(health.percentage)} used
        </div>
        <div className="text-xs text-gray-500">
          Growth: {formatGrowth(health.growth)}
        </div>
      </div>
    </div>
  );
};