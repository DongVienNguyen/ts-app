import React from 'react';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { PerformanceHealth } from './types';

interface PerformanceMetricProps {
  health: PerformanceHealth;
}

export const PerformanceMetric: React.FC<PerformanceMetricProps> = ({ health }) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        <CheckCircle className="h-4 w-4 text-green-600" />
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div>Avg: {health.averageResponseTime.toFixed(1)}ms</div>
        <div>Ops: {health.totalOperations}</div>
        <div className="truncate" title={health.slowestOperation || ''}>
          Slow: {health.slowestOperation?.split('-')[0] || 'N/A'}
        </div>
      </div>
    </div>
  );
};