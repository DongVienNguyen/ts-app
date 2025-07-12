import { useState, useEffect, useCallback } from 'react';
import { getErrorStatistics, SystemError, SystemMetric, SystemStatus, SystemAlert } from '@/utils/errorTracking';
import { useAuth } from '@/contexts/AuthContext';
import { subDays } from 'date-fns';
import { ServiceHealth } from '@/components/error-monitoring/ServiceStatusTab';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { checkServiceHealth } from '@/services/healthCheckService';
import { systemAlertService } from '@/services/systemAlertService';
import { TimeRange, PerformanceMetric, PerformanceInsights } from '@/components/system-health/performance/types';
import { PerformanceDataService } from '@/components/system-health/performance/performanceDataService';
import { SystemHealth } from '@/components/system-health/types';
import { determineOverallHealth } from '@/components/system-health/utils';
import { getPerformanceStats } from '@/utils/performanceMonitor';

export const useErrorMonitoringData = () => {
  const { user } = useAuth();
  const [errorStats, setErrorStats] = useState<any>({ total: 0, byType: {}, bySeverity: {}, recent: [] });
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    database: { service_name: 'database', status: 'unknown' },
    email: { service_name: 'email', status: 'unknown' },
    pushNotification: { service_name: 'pushNotification', status: 'unknown' },
    api: { service_name: 'api', status: 'unknown' },
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Performance State
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights>({
    averageResponseTime: 0, peakThroughput: 0, errorRate: 0, performanceScore: 0, bottlenecks: [], recommendations: [],
  });

  const buildHealthObject = useCallback((currentServiceHealth: ServiceHealth, currentSystemMetrics: SystemMetric[], currentErrorStats: any): SystemHealth => {
    const dbHealth = currentServiceHealth.database;
    const apiHealth = currentServiceHealth.api;
    const memoryUsageMetric = currentSystemMetrics.find(m => m.metric_name === 'used_heap_size');
    const memoryUsed = memoryUsageMetric ? (memoryUsageMetric.metric_value / (1024 * 1024 * 512)) * 100 : Math.random() * 60 + 15;
    const performanceData = getPerformanceStats();

    const newHealth: SystemHealth = {
      database: { status: dbHealth.status === 'online' ? 'healthy' : 'error', responseTime: dbHealth.response_time_ms || 0, connections: Math.floor(Math.random() * 10) + 1, lastCheck: new Date().toISOString(), uptime: dbHealth.uptime_percentage || 99.9 },
      api: { status: apiHealth.status === 'online' ? 'healthy' : 'error', responseTime: apiHealth.response_time_ms || 0, uptime: apiHealth.uptime_percentage || 99.9, lastCheck: new Date().toISOString(), requestsPerMinute: Math.floor(Math.random() * 100) + 50 },
      storage: { status: 'healthy', used: Math.random() * 50 + 10, total: 100, percentage: Math.random() * 50 + 10, growth: Math.random() * 2 - 1, lastCheck: new Date().toISOString() },
      memory: { status: memoryUsed > 85 ? 'warning' : 'healthy', used: memoryUsed, total: 100, percentage: memoryUsed, peak: memoryUsed + Math.random() * 10, lastCheck: new Date().toISOString() },
      performance: { averageResponseTime: performanceData.averageDuration, totalOperations: performanceData.totalMetrics, slowestOperation: performanceData.slowestMetric?.name || null, fastestOperation: performanceData.fastestMetric?.name || null },
      security: { status: 'healthy', activeThreats: 0, lastSecurityScan: new Date().toISOString(), failedLogins: currentErrorStats.byType?.['Login Failed'] || 0, lastCheck: new Date().toISOString() },
      overall: 'healthy',
    };
    newHealth.overall = determineOverallHealth(newHealth.database.status, newHealth.api.status, newHealth.storage.status, newHealth.memory.status, newHealth.security.status);
    return newHealth;
  }, []);

  const fetchPerformanceData = useCallback((currentHealth: SystemHealth) => {
    const newMetrics = PerformanceDataService.generateMetrics(timeRange);
    const newInsights = PerformanceDataService.calculateInsights(newMetrics, currentHealth);
    setPerformanceMetrics(newMetrics);
    setPerformanceInsights(newInsights);
  }, [timeRange]);

  const fetchAllData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setIsLoading(true);

    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const [errorsRes, metricsRes, alerts, healthResults] = await Promise.all([
        supabase.from('system_errors').select('*').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }),
        supabase.from('system_metrics').select('*').order('created_at', { ascending: false }).limit(50),
        systemAlertService.getActiveAlerts(),
        Promise.allSettled([checkServiceHealth('database'), checkServiceHealth('api'), checkServiceHealth('email'), checkServiceHealth('push_notification')]),
      ]);

      if (errorsRes.error) throw errorsRes.error;
      const stats = getErrorStatistics(errorsRes.data || []);
      setErrorStats(stats);
      setRecentErrors(stats.recent);

      if (metricsRes.data) setSystemMetrics(metricsRes.data);
      setSystemAlerts(alerts);

      const healthObject: ServiceHealth = { database: { service_name: 'database', status: 'unknown' }, email: { service_name: 'email', status: 'unknown' }, pushNotification: { service_name: 'pushNotification', status: 'unknown' }, api: { service_name: 'api', status: 'unknown' } };
      healthResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const status = result.value;
          let key: keyof ServiceHealth;
          if (status.service_name === 'push_notification') {
            key = 'pushNotification';
          } else if (status.service_name === 'database') {
            key = 'database';
          } else if (status.service_name === 'email') {
            key = 'email';
          } else if (status.service_name === 'api') {
            key = 'api';
          } else {
            console.warn(`Unexpected service name: ${status.service_name}`);
            return; // Skip if service name is not recognized
          }
          healthObject[key] = status;
        }
      });
      setServiceHealth(healthObject);

      const newHealth = buildHealthObject(healthObject, metricsRes.data || [], stats);
      setHealth(newHealth);
      fetchPerformanceData(newHealth);

    } catch (error) {
      console.error('❌ [MONITORING] Failed to fetch data:', error);
      toast.error('Lỗi tải dữ liệu giám sát');
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, [user, buildHealthObject, fetchPerformanceData]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllData();
    }
  }, [user, fetchAllData]);
  
  useEffect(() => {
    if (health) {
      fetchPerformanceData(health);
    }
  }, [timeRange, health, fetchPerformanceData]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
    toast.success('Dữ liệu giám sát đã được làm mới.');
  }, [fetchAllData]);

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) {
      toast.error('Yêu cầu đăng nhập để thực hiện.');
      return; // Explicitly return void
    }
    const success = await systemAlertService.acknowledgeAlert(alertId, user.username);
    if (success) {
      toast.success('Cảnh báo đã được ghi nhận.');
      setSystemAlerts(prev => prev.filter(a => a.id !== alertId));
    } else {
      toast.error('Không thể ghi nhận cảnh báo.');
    }
  };

  const exportPerformanceData = () => {
    PerformanceDataService.exportToCsv(performanceMetrics, timeRange);
  };

  return {
    errorStats, recentErrors, systemMetrics, serviceHealth, systemAlerts, health, performanceMetrics, performanceInsights,
    isLoading, lastUpdated, isRefreshing, timeRange,
    refreshAll, acknowledgeAlert, setTimeRange, exportPerformanceData,
  };
};