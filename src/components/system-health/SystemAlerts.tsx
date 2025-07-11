import React from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';

interface SystemAlertsProps {
  overallHealth: 'healthy' | 'warning' | 'error';
}

export const SystemAlerts: React.FC<SystemAlertsProps> = ({ overallHealth }) => {
  if (overallHealth === 'healthy') {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border ${
      overallHealth === 'error' 
        ? 'bg-red-50 border-red-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {overallHealth === 'error' ? (
          <XCircle className="h-4 w-4 text-red-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        <span className={`text-sm font-medium ${
          overallHealth === 'error' ? 'text-red-800' : 'text-yellow-800'
        }`}>
          System Health Alert
        </span>
      </div>
      <div className={`text-sm ${
        overallHealth === 'error' ? 'text-red-700' : 'text-yellow-700'
      }`}>
        {overallHealth === 'error' 
          ? 'Critical system issues detected. Immediate attention required.'
          : 'System performance issues detected. Monitoring recommended.'
        }
      </div>
    </div>
  );
};