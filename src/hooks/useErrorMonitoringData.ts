import { useState, useEffect, useCallback } from 'react';
import { getAuthenticatedSupabaseClient } from '@/integrations/supabase/client';
import { SystemError, SystemMetric, SystemStatus, checkServiceHealth, monitorResources } from '@/utils/errorTracking';

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
  topErrorTypes: { type: string; count: number }[];
  errorTrend: { date: string; count: number }[];
}

interface ServiceHealth {
  database: SystemStatus;
  email: SystemStatus;
  pushNotification: SystemStatus;
  api: SystemStatus;
}

export function useErrorMonitoringData() {
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    errorRate: 0,
    topErrorTypes: [],
    errorTrend: []
  });

  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    database: { service_name: 'database', status: 'online', uptime_percentage: 100 },
    email: { service_name: 'email', status: 'online', uptime_percentage: 100 },
    pushNotification: { service_name: 'push_notification', status: 'online', uptime_percentage: 100 },
    api: { service_name: 'api', status: 'online', uptime_percentage: 100 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadErrorData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get error statistics using authenticated client
      const client = getAuthenticatedSupabaseClient();
      const { data: errors, error } = await client
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentErrors24h = errors?.filter(e => new Date(e.created_at) > last24Hours) || [];
      const criticalErrors = errors?.filter(e => e.severity === 'critical') || [];
      const resolvedErrors = errors?.filter(e => e.status === 'resolved') || [];

      // Calculate error rate (errors per hour in last 24h)
      const errorRate = recentErrors24h.length / 24;

      // Top error types
      const errorTypeCounts: { [key: string]: number } = {};
      errors?.forEach(error => {
        errorTypeCounts[error.error_type] = (errorTypeCounts[error.error_type] || 0) + 1;
      });

      const topErrorTypes = Object.entries(errorTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Error trend (last 7 days)
      const errorTrend: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayErrors = errors?.filter(e => {
          const errorDate = new Date(e.created_at);
          return errorDate >= dayStart && errorDate <= dayEnd;
        }) || [];

        errorTrend.push({
          date: dateStr,
          count: dayErrors.length
        });
      }

      setErrorStats({
        totalErrors: errors?.length || 0,
        criticalErrors: criticalErrors.length,
        resolvedErrors: resolvedErrors.length,
        errorRate,
        topErrorTypes,
        errorTrend
      });

      setRecentErrors(errors?.slice(0, 20) || []);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading error data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSystemMetrics = useCallback(async () => {
    try {
      const client = getAuthenticatedSupabaseClient();
      const { data: metrics, error } = await client
        .from('system_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSystemMetrics(metrics || []);

      // Monitor current resources
      await monitorResources();
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  }, []);

  const checkAllServices = useCallback(async () => {
    try {
      const [database, email, pushNotification, api] = await Promise.all([
        checkServiceHealth('database'),
        checkServiceHealth('email'),
        checkServiceHealth('push_notification'),
        checkServiceHealth('api')
      ]);

      setServiceHealth({
        database,
        email,
        pushNotification,
        api
      });
    } catch (error) {
      console.error('Error checking service health:', error);
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadErrorData();
    loadSystemMetrics();
    checkAllServices();
  }, [loadErrorData, loadSystemMetrics, checkAllServices]);

  useEffect(() => {
    refreshAll();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Helper functions for styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '●';
      case 'degraded': return '⚠';
      case 'offline': return '●';
      case 'maintenance': return '⏱';
      default: return '●';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return {
    errorStats,
    recentErrors,
    systemMetrics,
    serviceHealth,
    isLoading,
    lastUpdated,
    refreshAll,
    getStatusColor,
    getStatusIcon,
    getSeverityColor
  };
}