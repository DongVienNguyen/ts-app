import React from 'react';

interface SystemHealthFooterProps {
  lastUpdated: Date;
  autoRefresh: boolean;
  overallHealth: 'healthy' | 'warning' | 'error';
}

export const SystemHealthFooter: React.FC<SystemHealthFooterProps> = ({
  lastUpdated,
  autoRefresh,
  overallHealth
}) => {
  return (
    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
      <div className="flex items-center gap-4">
        <span>Last updated: {lastUpdated.toLocaleString('vi-VN')}</span>
        <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          overallHealth === 'healthy' ? 'bg-green-500' : 
          overallHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
        <span className="capitalize">{overallHealth} Status</span>
      </div>
    </div>
  );
};