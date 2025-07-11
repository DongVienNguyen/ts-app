import React from 'react';
import { PerformanceHealth } from './types';

interface PerformanceInsightsProps {
  performance: PerformanceHealth;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({ performance }) => {
  if (performance.totalOperations === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Performance Insights</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-700">
        <div>
          <div className="font-medium">Average Response</div>
          <div>{performance.averageResponseTime.toFixed(1)}ms</div>
        </div>
        <div>
          <div className="font-medium">Total Operations</div>
          <div>{performance.totalOperations}</div>
        </div>
        <div>
          <div className="font-medium">Slowest Operation</div>
          <div className="truncate" title={performance.slowestOperation || 'N/A'}>
            {performance.slowestOperation?.split('-')[0] || 'N/A'}
          </div>
        </div>
        <div>
          <div className="font-medium">Fastest Operation</div>
          <div className="truncate" title={performance.fastestOperation || 'N/A'}>
            {performance.fastestOperation?.split('-')[0] || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};