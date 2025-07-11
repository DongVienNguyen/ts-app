import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    default:
      return Activity;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-100';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100';
    case 'error':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const formatUptime = (uptime: number): string => {
  return `${uptime.toFixed(2)}%`;
};

export const formatResponseTime = (responseTime: number): string => {
  return `${Math.round(responseTime)}ms`;
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};

export const formatGrowth = (growth: number): string => {
  return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
};

export const determineOverallHealth = (
  database: string,
  api: string,
  storage: string,
  memory: string,
  security: string
): 'healthy' | 'warning' | 'error' => {
  const statuses = [database, api, storage, memory, security];
  
  if (statuses.includes('error')) {
    return 'error';
  } else if (statuses.includes('warning')) {
    return 'warning';
  }
  return 'healthy';
};