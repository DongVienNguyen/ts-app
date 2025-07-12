import { useState, useEffect, useCallback } from 'react';
import { getErrorStatistics, SystemError, SystemMetric, SystemStatus, checkServiceHealth } from '@/utils/errorTracking';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay } from 'date-fns';
import { ServiceHealth } from '@/components/error-monitoring/ServiceStatusTab'; // Import ServiceHealth

export function useErrorMonitoringData() {
  const { user, loading: authLoading } = useAuth();

  const [errorStats, setErrorStats] = useState({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    errorRate: 0,
    topErrorTypes: [] as { type: string; count: number }[],
    errorTrend: [] as { date: string; count: number }[],
    byType: {},
    bySeverity: {},
    recent: [] as SystemError[],
  });
  const [recentErrors, setRecentErrors] = useState<SystemError[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  // Corrected type for serviceHealth and initialized with default values
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    database: { service_name: 'database', status: 'unknown', uptime_percentage: 0 },
    email: { service_name: 'email', status: 'unknown', uptime_percentage: 0 },
    pushNotification: { service_name: 'pushNotification', status: 'unknown', uptime_percentage: 0 },
    api: { service_name: 'api', status: 'unknown', uptime_percentage: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    console.log('🔄 Loading error statistics...');
    try {
      const [statsResult, healthResult] = await Promise.allSettled([
        getErrorStatistics('week'),
        Promise.all([
          checkServiceHealth('database'),
          checkServiceHealth('api'),
          checkServiceHealth('email'),
          checkServiceHealth('push_notification'),
        ]),
      ]);

      if (statsResult.status === 'fulfilled' && statsResult.value) {
        const stats = statsResult.value;
        const totalErrors = stats.total;
        const criticalErrors = stats.bySeverity.critical || 0;
        const resolvedErrors = stats.recent.filter(e => e.status === 'resolved').length;
        const errorRate = totalErrors / (7 * 24);

        const topErrorTypes = Object.entries(stats.byType)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => ({ type, count }));

        const trendData: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          trendData[date] = 0;
        }
        stats.recent.forEach(error => {
          if (error.created_at) {
            const date = format(startOfDay(new Date(error.created_at)), 'yyyy-MM-dd');
            if (trendData[date] !== undefined) {
              trendData[date]++;
            }
          }
        });
        const errorTrend = Object.entries(trendData).map(([date, count]) => ({ date, count }));

        setErrorStats({
          ...stats,
          totalErrors,
          criticalErrors,
          resolvedErrors,
          errorRate,
          topErrorTypes,
          errorTrend,
        });
        setRecentErrors(stats.recent);
        console.log('✅ Error stats loaded:', { totalErrors, criticalErrors });
      } else if (statsResult.status === 'rejected') {
        console.error('❌ Failed to load error statistics:', statsResult.reason);
      }

      if (healthResult.status === 'fulfilled' && healthResult.value) {
        const healthObject: ServiceHealth = healthResult.value.reduce((acc, status) => {
          let key = status.service_name;
          if (key === 'push_notification') key = 'pushNotification';
          // Ensure all expected keys are present, even if a service check fails
          if (key === 'database' || key === 'email' || key === 'pushNotification' || key === 'api') {
            acc[key] = status;
          }
          return acc;
        }, { // Provide default values for all properties to ensure type safety
          database: { service_name: 'database', status: 'unknown', uptime_percentage: 0 },
          email: { service_name: 'email', status: 'unknown', uptime_percentage: 0 },
          pushNotification: { service_name: 'pushNotification', status: 'unknown', uptime_percentage: 0 },
          api: { service_name: 'api', status: 'unknown', uptime_percentage: 0 },
        } as ServiceHealth); // Explicitly cast to ServiceHealth
        setServiceHealth(healthObject);
        console.log('✅ Service health loaded:', healthObject);
      } else if (healthResult.status === 'rejected') {
        console.error('❌ Failed to load service health:', healthResult.reason);
      }

    } catch (error) {
      console.error('❌ Failed to fetch error monitoring data:', error);
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
    if (user) {
      fetchAllData();
    } else {
      setIsLoading(false);
      setErrorStats({
        totalErrors: 0, criticalErrors: 0, resolvedErrors: 0, errorRate: 0,
        topErrorTypes: [], errorTrend: [], byType: {}, bySeverity: {}, recent: [],
      });
      setRecentErrors([]);
      // Reset serviceHealth to its initial state when user logs out
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
    lastUpdated,
    refreshAll: fetchAllData,
    getStatusColor,
    getSeverityColor,
  };
}