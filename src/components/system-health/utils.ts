import { CheckCircle, AlertTriangle, XCircle, LucideProps } from 'lucide-react';
import React from 'react';

export const determineOverallHealth = (
  dbStatus: 'healthy' | 'warning' | 'error',
  apiStatus: 'healthy' | 'warning' | 'error',
  storageStatus: 'healthy' | 'warning' | 'error',
  memoryStatus: 'healthy' | 'warning' | 'error',
  securityStatus: 'healthy' | 'warning' | 'error',
  emailStatus: 'healthy' | 'warning' | 'error',
  pushStatus: 'healthy' | 'warning' | 'error'
): 'healthy' | 'warning' | 'error' => {
  const statuses = [dbStatus, apiStatus, storageStatus, memoryStatus, securityStatus, emailStatus, pushStatus];
  if (statuses.some(s => s === 'error')) {
    return 'error';
  }
  if (statuses.some(s => s === 'warning')) {
    return 'warning';
  }
  return 'healthy';
};

export const getStatusIcon = (status: 'healthy' | 'warning' | 'error'): React.FC<LucideProps> => {
  const colorMap = {
    healthy: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  const IconMap = {
    healthy: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const IconComponent = IconMap[status];
  const colorClass = colorMap[status];

  return (props) => <IconComponent {...props} className={`${colorClass} ${props.className || ''}`} />;
};

export const getStatusColor = (status: 'healthy' | 'warning' | 'error'): string => {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
  }
};

export const formatResponseTime = (ms: number): string => `${Math.round(ms)}ms`;

export const formatUptime = (percentage: number): string => `${percentage.toFixed(2)}%`;

export const formatPercentage = (percentage: number): string => `${Math.round(percentage)}%`;

export const formatGrowth = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%/day`;
};