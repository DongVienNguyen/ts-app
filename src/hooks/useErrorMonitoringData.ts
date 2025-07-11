import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';

interface SystemError {
  id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  function_name?: string;
  user_id?: string;
  severity: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
  topErrorTypes: { type: string; count: number }[];
  errorTrend: { date: string; count: number }[];
}

interface SystemStatus {
  service_name: string;
  status: string;
  uptime_percentage?: number;
}

export function useErrorMonitoringData() {
  const { user } = useSecureAuth();
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    errorRate: 0,
    topErrorTypes: [],
    errorTrend: []
  });

  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any[]>([]);
  const [serviceHealth, setServiceHealth] = useState({
    database: { service_name: 'database', status: 'online', uptime_percentage: 100 },
    email: { service_name: 'email', status: 'online', uptime_percentage: 100 },
    pushNotification: { service_name: 'push_notification', status: 'online', uptime_percentage: 100 },
    api: { service_name: 'api', status: 'online', uptime_percentage: 100 }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Only load data if user is admin
  const canAccess = user?.role === 'admin';

  const loadErrorData = useCallback(async () => {
    if (!canAccess) {
      console.log('🚫 Access denied: User is not admin');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📊 Loading error monitoring data...');

      // Load recent errors only (last 7 days, max 100 records)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: errors, error } = await supabase
        .from('system_errors')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('⚠️ Error loading system errors:', error);
        // Don't throw, just use empty array
        setRecentErrors([]);
        setErrorStats({
          totalErrors: 0,
          criticalErrors: 0,
          resolvedErrors: 0,
          errorRate: 0,
          topErrorTypes: [],
          errorTrend: []
        });
        return;
      }

      const errorList = errors || [];
      setRecentErrors(errorList);

      // Calculate stats from loaded data
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentErrors24h = errorList.filter(e => new Date(e.created_at) > last24Hours);
      
      const totalErrors = errorList.length;
      const criticalErrors = errorList.filter(e => e.severity === 'critical').length;
      const resolvedErrors = errorList.filter(e => e.status === 'resolved').length;
      const errorRate = recentErrors24h.length / 24; // errors per hour

      // Top error types
      const errorTypeCounts: { [key: string]: number } = {};
      errorList.forEach(error => {
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
        const dayErrors = errorList.filter(e => e.created_at.startsWith(dateStr));
        errorTrend.push({ date: dateStr, count: dayErrors.length });
      }

      setErrorStats({
        totalErrors,
        criticalErrors,
        resolvedErrors,
        errorRate,
        topErrorTypes,
        errorTrend
      });

      setLastUpdated(new Date());
      console.log('✅ Error monitoring data loaded:', {
        totalErrors,
        criticalErrors,
        resolvedErrors,
        errorRate: errorRate.toFixed(1)
      });

    } catch (error) {
      console.error('❌ Error loading error data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess]);

  const loadSystemMetrics = useCallback(async () => {
    if (!canAccess) return;

    try {
      // Load recent metrics only (last 24 hours, max 50 records)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

      const { data: metrics, error } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && metrics) {
        setSystemMetrics(metrics);
      }
    } catch (error) {
      console.warn('⚠️ Error loading system metrics:', error);
    }
  }, [canAccess]);

  const checkAllServices = useCallback(async () => {
    if (!canAccess) return;

    try {
      // Simple service health check
      const { data: statusData, error } = await supabase
        .from('system_status')
        .select('*')
        .order('last_check', { ascending: false })
        .limit(10);

      if (!error && statusData) {
        // Update service health based on latest status
        const updatedHealth = { ...serviceHealth };
        statusData.forEach(status => {
          if (updatedHealth[status.service_name as keyof typeof updatedHealth]) {
            updatedHealth[status.service_name as keyof typeof updatedHealth] = {
              service_name: status.service_name,
              status: status.status,
              uptime_percentage: status.uptime_percentage || 100
            };
          }
        });
        setServiceHealth(updatedHealth);
      }
    } catch (error) {
      console.warn('⚠️ Error checking service health:', error);
    }
  }, [canAccess, serviceHealth]);

  const refreshAll = useCallback(() => {
    if (canAccess) {
      loadErrorData();
      loadSystemMetrics();
      checkAllServices();
    }
  }, [canAccess, loadErrorData, loadSystemMetrics, checkAllServices]);

  // Load data only when user has access
  useEffect(() => {
    if (canAccess) {
      refreshAll();
    } else {
      // Clear data if user doesn't have access
      setRecentErrors([]);
      setErrorStats({
        totalErrors: 0,
        criticalErrors: 0,
        resolvedErrors: 0,
        errorRate: 0,
        topErrorTypes: [],
        errorTrend: []
      });
      setSystemMetrics([]);
    }
  }, [canAccess]); // Only depend on canAccess

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
    canAccess,
    refreshAll,
    getStatusColor,
    getStatusIcon,
    getSeverityColor
  };
}