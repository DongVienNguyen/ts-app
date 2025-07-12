import { useState, useEffect, useCallback } from 'react';
import { SystemError, SystemMetric, SystemStatus } from '@/utils/errorTracking';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay } from 'date-fns';
import { ServiceHealth } from '@/components/error-monitoring/ServiceStatusTab';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseUserAgent } from '@/utils/userAgentParser';
import { checkServiceHealth } from '@/services/healthCheckService';

// Define the structure for error statistics
interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  errorRate: number;
  topErrorTypes: { type: string; count: number }[];
  errorTrend: { date: string; count: number }[];
  byType: { [key: string]: number };
  bySeverity: { [key: string]: number };
  byBrowser: { [key: string]: number };
  byOS: { [key: string]: number };
  recent: SystemError[];
}

// Helper function to process raw error data into error statistics
const processErrorData = (errors: SystemError[]): ErrorStats => {
  const totalErrors = errors?.length || 0;
  const criticalErrors = errors?.filter(e => e.severity === 'critical').length || 0;
  const resolvedErrors = errors?.filter(e => e.status === 'resolved').length || 0;
  const errorRate = Number(totalErrors) / (7 * 24); // Assuming 7 days * 24 hours for a rough rate

  const byType = errors?.reduce((acc: { [key: string]: number }, error) => {
    acc[error.error_type] = (acc[error.error_type] || 0) + 1;
    return acc;
  }, {}) || {};

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
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([type, count]) => ({ type, count: Number(count) }));

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

  return {
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
  };
};

export function useErrorMonitoringData() {
  const { user, loading: authLoading } = useAuth();

  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    errorRate: 0,
    topErrorTypes: [],
    errorTrend: [],
    byType: {},
    bySeverity: {},
    byBrowser: {},
    byOS: {},
    recent: [],
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

  const refreshRecentErrors = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    setIsRefreshingErrors(true);
    console.log('🔄 [ERROR_MONITORING] Refreshing recent errors only...');

    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: freshErrors, error } = await supabase
        .from('system_errors')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ERROR_MONITORING] Error refreshing errors:', error);
        toast.error('Lỗi làm mới dữ liệu');
        return;
      }

      console.log('✅ [ERROR_MONITORING] Refreshed errors:', freshErrors?.length || 0);
      setRecentErrors(freshErrors || []);
      setErrorStats(processErrorData(freshErrors || [])); // Use helper function

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
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data: errors, error: errorsError } = await supabase
        .from('system_errors')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (errorsError) {
        console.error('❌ [ERROR_MONITORING] Error loading errors:', errorsError);
        throw errorsError;
      }

      console.log('✅ [ERROR_MONITORING] Loaded errors:', errors?.length || 0);

      setErrorStats(processErrorData(errors || [])); // Use helper function
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

        healthResults.forEach((result) => {
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
  };
}