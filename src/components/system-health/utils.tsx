import { SystemHealthMetric } from './types';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const determineOverallHealth = (
  dbStatus: SystemHealthMetric['status'],
  apiStatus: SystemHealthMetric['status'],
  storageStatus: SystemHealthMetric['status'],
  memoryStatus: SystemHealthMetric['status'],
  securityStatus: SystemHealthMetric['status'],
  emailStatus: SystemHealthMetric['status'],
  pushNotificationStatus: SystemHealthMetric['status']
): SystemHealthMetric['status'] => {
  if (
    dbStatus === 'error' ||
    apiStatus === 'error' ||
    storageStatus === 'error' ||
    memoryStatus === 'error' ||
    securityStatus === 'error' ||
    emailStatus === 'error' ||
    pushNotificationStatus === 'error'
  ) {
    return 'error';
  }
  if (
    dbStatus === 'warning' ||
    apiStatus === 'warning' ||
    storageStatus === 'warning' ||
    memoryStatus === 'warning' ||
    securityStatus === 'warning' ||
    emailStatus === 'warning' ||
    pushNotificationStatus === 'warning'
  ) {
    return 'warning';
  }
  return 'healthy';
};

export const getStatusIcon = (status: SystemHealthMetric['status']) => {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    default:
      return CheckCircle;
  }
};

export const getStatusColor = (status: SystemHealthMetric['status']) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatResponseTime = (ms: number) => {
  return `${ms.toFixed(0)}ms`;
};

export const formatUptime = (percentage: number) => {
  return `${percentage.toFixed(2)}%`;
};

export const formatPercentage = (percentage: number) => {
  return `${percentage.toFixed(1)}%`;
};

export const formatGrowth = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};