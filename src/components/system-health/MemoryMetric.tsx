import React from 'react';
import { Cpu } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { MemoryHealth } from './types';
import { getStatusIcon, formatPercentage } from './utils';

interface MemoryMetricProps {
  health: MemoryHealth;
}

export const MemoryMetric: React.FC<MemoryMetricProps> = ({ health }) => {
  const StatusIcon = getStatusIcon(health.status);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium">Memory</span>
        </div>
        <StatusIcon className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <Progress value={health.percentage} className="h-2" />
        <div className="text-xs text-gray-600">
          {formatPercentage(health.percentage)} used
        </div>
        <div className="text-xs text-gray-500">
          Peak: {formatPercentage(health.peak)}
        </div>
      </div>
    </div>
  );
};