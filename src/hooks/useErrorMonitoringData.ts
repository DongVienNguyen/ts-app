import { useState, useEffect, useCallback } from 'react';
import { getErrorStatistics, SystemError, SystemMetric, SystemStatus, SystemAlert } from '@/utils/errorTracking';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay } from 'date-fns';
import { ServiceHealth } from '@/components/error-monitoring/ServiceStatusTab';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseUserAgent } from '@/utils/userAgentParser';
import { checkServiceHealth } from '@/services/healthCheckService';
import { healthCheckService } from '@/services/healthCheckService';
import { systemAlertService } from '@/services/systemAlertService';

export const useErrorMonitoringData = () => {
  const { user } = useAuth();
  const [errorStats, setErrorStats] = useState<any>({ total: 0, byType: {}, bySeverity: {}, recent: [] });
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({ // Changed type to ServiceHealth
    database: { service_name: 'database', status: 'unknown' },
    email: { service_name: 'email', status: 'unknown' },
    pushNotification: { service_name: 'pushNotification', status: 'unknown' },
    api: { service_name: 'api', status: 'unknown' },
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingErrors, setIsRefreshingErrors] = useState(false);
  const [isRefreshingAlerts, setIsRefreshingAlerts] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchErrorData = useCallback(async () => {
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
      const stats = getErrorStatistics(freshErrors || []); // Use the refactored getErrorStatistics
      setErrorStats(stats);
      setRecentErrors(stats.recent);

      toast.success('Đã làm mới dữ liệu lỗi');
    } catch (err: any) {
      console.error('❌ [ERROR_MONITORING] Refresh failed:', err);
      toast.error('Lỗi làm mới dữ liệu');
    } finally {
      setIsRefreshingErrors(false);
      setLastUpdated(new Date());
    }
  }, [user]);

  const fetchSystemAlerts = useCallback(async () => {
    const alerts = await systemAlertService.getActiveAlerts();
    setSystemAlerts(alerts);
  }, []);

  const fetchHealthData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

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

      const stats = getErrorStatistics(errors || []); // Use the refactored getErrorStatistics
      setErrorStats(stats);
      setRecentErrors(stats.recent);

      // Load service health
      try {
        const healthResults = await Promise.allSettled([
          checkServiceHealth('database'),
          checkServiceHealth('api'),
          checkServiceHealth('email'),
          checkServiceHealth('push_notification'),
        ]);

        const healthObject: ServiceHealth = {
          database: { service_name: 'database', status: 'unknown' },
          email: { service_name: 'email', status: 'unknown' },
          pushNotification: { service_name: 'pushNotification', status: 'unknown' },
          api: { service_name: 'api', status: 'unknown' },
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

        setServiceHealth(healthObject); // Removed Object.values()
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
    }
  }, [user]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchErrorData(),
      fetchHealthData(),
      fetchSystemAlerts(),
    ]);
    setIsLoading(false);
    setLastUpdated(new Date());
  }, [fetchErrorData, fetchHealthData, fetchSystemAlerts]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const refreshAll = useCallback(async () => {
    fetchAllData();
    toast.success('Dữ liệu giám sát đã được làm mới.');
  }, [fetchAllData]);

  const refreshRecentErrors = useCallback(async () => {
    fetchErrorData();
    setIsRefreshingErrors(false);
    setLastUpdated(new Date());
  }, [fetchErrorData]);

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) {
      toast.error('Yêu cầu đăng nhập để thực hiện.');
      return;
    }
    const success = await systemAlertService.acknowledgeAlert(alertId, user.username);
    if (success) {
      toast.success('Cảnh báo đã được ghi nhận.');
      await fetchSystemAlerts(); // Refresh alerts list
    } else {
      toast.error('Không thể ghi nhận cảnh báo.');
    }
  };

  return {
    errorStats,
    recentErrors,
    systemMetrics,
    serviceHealth,
    systemAlerts,
    isLoading,
    lastUpdated,
    refreshAll,
    refreshRecentErrors,
    isRefreshingErrors,
    acknowledgeAlert,
    isRefreshingAlerts,
  };
}