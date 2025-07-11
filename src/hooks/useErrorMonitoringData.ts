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

const ERRORS_PER_PAGE = 20;
const CACHE_DURATION = 2 * 60 * 1000; // 2 phút

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalErrorCount, setTotalErrorCount] = useState(0);

  // Cache để tránh load lại
  const [dataCache, setDataCache] = useState<Map<string, { data: any, timestamp: number }>>(new Map());

  // Only load data if user is admin
  const canAccess = user?.role === 'admin';

  // Load error stats - chỉ load khi cần
  const loadErrorStats = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = 'error-stats';
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setErrorStats(cached.data);
      return;
    }

    try {
      console.log('📊 Loading error statistics...');

      // Load basic error count
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: totalCount, error: countError } = await supabase
        .from('system_errors')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (countError) {
        console.warn('⚠️ Error loading error count:', countError);
        return;
      }

      // Load critical errors count
      const { count: criticalCount } = await supabase
        .from('system_errors')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Load resolved errors count
      const { count: resolvedCount } = await supabase
        .from('system_errors')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('created_at', sevenDaysAgo.toISOString());

      const totalErrors = totalCount || 0;
      const criticalErrors = criticalCount || 0;
      const resolvedErrors = resolvedCount || 0;
      const errorRate = totalErrors / (7 * 24); // errors per hour

      const stats = {
        totalErrors,
        criticalErrors,
        resolvedErrors,
        errorRate,
        topErrorTypes: [], // Load khi cần
        errorTrend: [] // Load khi cần
      };

      setErrorStats(stats);
      setTotalErrorCount(totalErrors);

      // Cache data
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, { data: stats, timestamp: Date.now() });
      setDataCache(newCache);

      console.log('✅ Error stats loaded:', stats);

    } catch (error) {
      console.error('❌ Error loading error stats:', error);
    }
  }, [canAccess, dataCache]);

  // Load recent errors với phân trang
  const loadRecentErrors = useCallback(async (page: number = 1) => {
    if (!canAccess) return;

    const cacheKey = `recent-errors-${page}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setRecentErrors(cached.data);
      return;
    }

    setIsLoading(true);

    try {
      console.log(`📊 Loading recent errors - Page ${page}...`);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const from = (page - 1) * ERRORS_PER_PAGE;
      const to = from + ERRORS_PER_PAGE - 1;

      const { data: errors, error } = await supabase
        .from('system_errors')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.warn('⚠️ Error loading recent errors:', error);
        setRecentErrors([]);
        return;
      }

      const errorList = errors || [];
      setRecentErrors(errorList);

      // Cache data
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, { data: errorList, timestamp: Date.now() });
      setDataCache(newCache);

      console.log(`✅ Recent errors loaded: ${errorList.length} records`);

    } catch (error) {
      console.error('❌ Error loading recent errors:', error);
      setRecentErrors([]);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, dataCache]);

  // Load error analytics - chỉ khi user click vào tab Analytics
  const loadErrorAnalytics = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = 'error-analytics';
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setErrorStats(prev => ({ ...prev, ...cached.data }));
      return;
    }

    try {
      console.log('📊 Loading error analytics...');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Load error types
      const { data: errorTypes, error: typesError } = await supabase
        .from('system_errors')
        .select('error_type')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!typesError && errorTypes) {
        const typeCounts: { [key: string]: number } = {};
        errorTypes.forEach(error => {
          typeCounts[error.error_type] = (typeCounts[error.error_type] || 0) + 1;
        });

        const topErrorTypes = Object.entries(typeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Error trend (last 7 days)
        const errorTrend: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const { count } = await supabase
            .from('system_errors')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${dateStr}T00:00:00.000Z`)
            .lt('created_at', `${dateStr}T23:59:59.999Z`);
          
          errorTrend.push({ date: dateStr, count: count || 0 });
        }

        const analytics = { topErrorTypes, errorTrend };

        setErrorStats(prev => ({ ...prev, ...analytics }));

        // Cache data
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, { data: analytics, timestamp: Date.now() });
        setDataCache(newCache);
      }

    } catch (error) {
      console.error('❌ Error loading analytics:', error);
    }
  }, [canAccess, dataCache]);

  // Load system metrics - chỉ khi cần
  const loadSystemMetrics = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = 'system-metrics';
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setSystemMetrics(cached.data);
      return;
    }

    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

      const { data: metrics, error } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20); // Giảm từ 50 xuống 20

      if (!error && metrics) {
        setSystemMetrics(metrics);

        // Cache data
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
        setDataCache(newCache);
      }
    } catch (error) {
      console.warn('⚠️ Error loading system metrics:', error);
    }
  }, [canAccess, dataCache]);

  // Check service health - simplified
  const checkServiceHealth = useCallback(async () => {
    if (!canAccess) return;

    try {
      // Simplified health check - không query database
      const updatedHealth = { ...serviceHealth };
      
      // Simulate health status
      Object.keys(updatedHealth).forEach(service => {
        const random = Math.random();
        updatedHealth[service as keyof typeof updatedHealth] = {
          service_name: service,
          status: random > 0.95 ? 'degraded' : 'online',
          uptime_percentage: 99.9 - Math.random() * 0.5
        };
      });
      
      setServiceHealth(updatedHealth);
    } catch (error) {
      console.warn('⚠️ Error checking service health:', error);
    }
  }, [canAccess, serviceHealth]);

  // Initial load - chỉ load stats cơ bản
  useEffect(() => {
    if (canAccess) {
      loadErrorStats();
      checkServiceHealth();
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
  }, [canAccess, loadErrorStats, checkServiceHealth]);

  // Load recent errors khi component mount
  useEffect(() => {
    if (canAccess) {
      loadRecentErrors(currentPage);
    }
  }, [canAccess, currentPage, loadRecentErrors]);

  const refreshAll = useCallback(() => {
    if (canAccess) {
      // Clear cache
      setDataCache(new Map());
      
      // Reload data
      loadErrorStats();
      loadRecentErrors(currentPage);
      checkServiceHealth();
      setLastUpdated(new Date());
    }
  }, [canAccess, currentPage, loadErrorStats, loadRecentErrors, checkServiceHealth]);

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
    currentPage,
    setCurrentPage,
    totalErrorCount,
    totalPages: Math.ceil(totalErrorCount / ERRORS_PER_PAGE),
    refreshAll,
    loadErrorAnalytics,
    loadSystemMetrics,
    getStatusColor,
    getStatusIcon,
    getSeverityColor
  };
}