import { useState, useEffect, useCallback } from 'react';
import { getErrorStatistics, SystemError, SystemMetric, SystemStatus, checkServiceHealth } from '@/utils/errorTracking';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay } from 'date-fns';
import { ServiceHealth } from '@/components/error-monitoring/ServiceStatusTab';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseUserAgent } from '@/utils/userAgentParser';

export function useErrorMonitoringData() {
  const { user, loading: authLoading } = useAuth();

  const [errorStats, setErrorStats] = useState({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    errorRate: 0,
    topErrorTypes: [] as { type: string; count: number }[],
    errorTrend: [] as { date: string; count: number }[],
    byType: {} as { [key: string]: number },
    bySeverity: {} as { [key: string]: number },
    byBrowser: {} as { [key: string]: number },
    byOS: {} as { [key: string]: number },
    recent: [] as SystemError[],
  });
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    database: { service_name: 'database', status: 'unknown', uptime_percentage: 0 },
    email: { service_name: 'email', status: 'unknown', uptime_percentage: 0 },
    pushNotification: { service_name: 'pushNotification', status: 'unknown', uptime_percentage: 0 },
    api: { service_name: 'api', status: 'unknown', uptime_percentage: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingErrors, setIsRefreshingErrors] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function để refresh chỉ recent errors
  const refreshRecentErrors = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsRefreshingErrors(true);
    console.log('🔄 [ERROR_MONITORING] Refreshing recent errors only...');
    
    try {
      const { data: freshErrors, error } = await supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ [ERROR_MONITORING] Error refreshing errors:', error);
        toast.error('Lỗi làm mới dữ liệu');
        return;
      }

      console.log('✅ [ERROR_MONITORING] Refreshed errors:', freshErrors?.length || 0);
      setRecentErrors(freshErrors || []);
      
      // Cập nhật stats từ fresh errors
      const totalErrors = freshErrors?.length || 0;
      const criticalErrors = freshErrors?.filter(e => e.severity === 'critical').length || 0;
      const resolvedErrors = freshErrors?.filter(e => e.status === 'resolved').length || 0;
      const errorRate = Number(totalErrors) / (7 * 24); // Fix: Cast to Number

      const errorTypeCount = freshErrors?.reduce((acc: { [key: string]: number }, error) => {
        acc[error.error_type] = (acc[error.error_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const topErrorTypes = Object.entries(errorTypeCount)
        .sort(([, a], [, b]) => Number(b) - Number(a)) // Fix: Cast to Number
        .map(([type, count]) => ({ type, count: Number(count) })); // Fix: Cast count to Number

      // Generate error trend for last 7 days
      const trendData: { [key: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        trendData[date] = 0;
      }
      
      freshErrors?.forEach(error => {
        if (error.created_at) {
          const date = format(startOfDay(new Date(error.created_at)), 'yyyy-MM-dd');
          if (trendData[date] !== undefined) {
            trendData[date]++;
          }
        }
      });
      
      const errorTrend = Object.entries(trendData).map(([date, count]) => ({ date, count }));

      setErrorStats(prev => ({
        ...prev,
        totalErrors,
        criticalErrors,
        resolvedErrors,
        errorRate,
        topErrorTypes,
        errorTrend,
        recent: freshErrors || [],
      }));

      toast.success('Đã làm mới dữ liệu lỗi');
    } catch (err: any) {
      console.error('❌ [ERROR_MONITORING] Refresh failed:', err);
      toast.error('Lỗi làm mới dữ liệu');
    } finally {
      setIsRefreshingErrors(false);
    }
  }, [user]);

  const fetchAllData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    setIsLoading(true);
    console.log('🔄 [ERROR_MONITORING] Loading error monitoring data...');
    
    try {
      // Load errors directly from database
      const { data: errors, error: errorsError } = await supabase
        .from('system_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (errorsError) {
        console.error('❌ [ERROR_MONITORING] Error loading errors:', errorsError);
        throw errorsError;
      }

      console.log('✅ [ERROR_MONITORING] Loaded errors:', errors?.length || 0);

      const totalErrors = errors?.length || 0;
      const criticalErrors = errors?.filter(e => e.severity === 'critical').length || 0;
      const resolvedErrors = errors?.filter(e => e.status === 'resolved').length || 0;
      const errorRate = Number(totalErrors) / (7 * 24); // Fix: Cast to Number

      // Group by type
      const byType = errors?.reduce((acc: { [key: string]: number }, error) => {
        acc[error.error_type] = (acc[error.error_type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Group by severity
      const bySeverity = errors?.reduce((acc: { [key: string]: number }, error) => {
        const severity = error.severity || 'medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {}) || {};

      const byBrowser: { [key: string]: number } = {};
      const byOS: { [key: string]: number } = {};

      errors?.forEach(error => {
        const { browser, os } = parseUserAgent(error.user_agent);
        byBrowser[browser] = (byBrowser[browser] || 0) + 1;
        byOS[os] = (byOS[os] || 0) + 1;
      });

      const topErrorTypes = Object.entries(byType)
        .sort(([, a], [, b]) => Number(b) - Number(a)) // Fix: Cast to Number
        .map(([type, count]) => ({ type, count: Number(count) })); // Fix: Cast count to Number

      // Generate error trend for last 7 days
      const trendData: { [key: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        trendData[date] = 0;
      }
      
      errors?.forEach(error => {
        if (error.created_at) {
          const date = format(startOfDay(new Date(error.created_at)), 'yyyy-MM-dd');
          if (trendData[date] !== undefined) {
            trendData[date]++;
          }
        }
      });
      
      const errorTrend = Object.entries(trendData).map(([date, count]) => ({ date, count }));

      setErrorStats({
        totalErrors,
        criticalErrors,
        resolvedErrors,
        errorRate,
        topErrorTypes,
        errorTrend,
        byType,
        bySeverity,
        byBrowser,
        byOS,
        recent: errors?.slice(0, 10) || [],
      });

      setRecentErrors(errors || []);

      // Load service health
      try {
        const healthResults = await Promise.allSettled([
          checkServiceHealth('database'),
          checkServiceHealth('api'),
          checkServiceHealth('email'),
          checkServiceHealth('push_notification'),
        ]);

        const healthObject: ServiceHealth = {
          database: { service_name: 'database', status: 'unknown', uptime_percentage: 0 },
          email: { service_name: 'email', status: 'unknown', uptime_percentage: 0 },
          pushNotification: { service_name: 'pushNotification', status: 'unknown', uptime_percentage: 0 },
          api: { service_name: 'api', status: 'unknown', uptime_percentage: 0 },
        };

        healthResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const status = result.value;
            let key = status.service_name;
            if (key === 'push_notification') key = 'pushNotification';
            if (key === 'database' || key === 'email' || key === 'pushNotification' || key === 'api') {
              healthObject[key] = status;
            }
          }
        });

        setServiceHealth(healthObject);
        console.log('✅ [ERROR_MONITORING] Service health loaded');
      } catch (healthError) {
        console.error('❌ [ERROR_MONITORING] Failed to load service health:', healthError);
      }

      // Load system metrics
      try {
        const { data: metrics, error: metricsError } = await supabase
          .from('system_metrics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!metricsError && metrics) {
          setSystemMetrics(metrics);
          console.log('✅ [ERROR_MONITORING] System metrics loaded:', metrics.length);
        }
      } catch (metricsError) {
        console.error('❌ [ERROR_MONITORING] Failed to load metrics:', metricsError);
      }

    } catch (error) {
      console.error('❌ [ERROR_MONITORING] Failed to fetch error monitoring data:', error);
      toast.error('Lỗi tải dữ liệu giám sát lỗi');
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    
    if (user && user.role === 'admin') {
      fetchAllData();

      const channel = supabase.channel('system-errors-realtime-channel')
        .on<SystemError>(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'system_errors' },
          (payload) => {
            console.log('✅ [REALTIME] New error received:', payload.new);
            toast.warning(`Lỗi mới: ${payload.new.error_type}`, {
              description: payload.new.error_message,
              action: {
                label: 'Làm mới',
                onClick: () => fetchAllData(),
              },
            });
            setRecentErrors(prevErrors => [payload.new as SystemError, ...prevErrors]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setIsLoading(false);
      // Reset data when user is not admin
      setErrorStats({
        totalErrors: 0, criticalErrors: 0, resolvedErrors: 0, errorRate: 0,
        topErrorTypes: [], errorTrend: [], byType: {}, bySeverity: {}, byBrowser: {}, byOS: {}, recent: [],
      });
      setRecentErrors([]);
      setSystemMetrics([]);
      setServiceHealth({
        database: { service_name: 'database', status: 'unknown', uptime_percentage: 0 },
        email: { service_name: 'email', status: 'unknown', uptime_percentage: 0 },
        pushNotification: { service_name: 'pushNotification', status: 'unknown', uptime_percentage: 0 },
        api: { service_name: 'api', status: 'unknown', uptime_percentage: 0 },
      });
    }
  }, [user, authLoading, fetchAllData]);

  const getStatusColor = (status: string) => {
    if (status === 'online') return 'text-green-600 bg-green-100';
    if (status === 'degraded') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
    isLoading: authLoading || isLoading,
    isRefreshingErrors,
    lastUpdated,
    refreshAll: fetchAllData,
    refreshRecentErrors,
    getStatusColor,
    getSeverityColor,
  };
}