import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UsageOverview {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  totalPageViews: number;
  bounceRate: number;
  activeUsers: number;
}

interface DeviceStats {
  desktop: number;
  mobile: number;
  tablet: number;
  [key: string]: number;
}

interface BrowserStats {
  [browser: string]: number;
}

interface TimeRangeData {
  hourly: { hour: string; users: number; sessions: number }[];
  daily: { date: string; users: number; sessions: number }[];
  monthly: { month: string; users: number; sessions: number }[];
}

const SESSIONS_PER_PAGE = 100;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export function useUsageData() {
  const { user } = useSecureAuth();
  const [usageOverview, setUsageOverview] = useState<UsageOverview>({
    totalSessions: 0,
    uniqueUsers: 0,
    averageSessionDuration: 0,
    totalPageViews: 0,
    bounceRate: 0,
    activeUsers: 0
  });

  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    desktop: 0,
    mobile: 0,
    tablet: 0
  });

  const [browserStats, setBrowserStats] = useState<BrowserStats>({});
  const [timeRangeData, setTimeRangeData] = useState<TimeRangeData>({
    hourly: [],
    daily: [],
    monthly: []
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Cache system
  const [dataCache, setDataCache] = useState<Map<string, { data: any, timestamp: number }>>(new Map());

  // Only load data if user is admin
  const canAccess = user?.role === 'admin';

  // Calculate date range helper
  const getDateRange = useCallback((timeRange: typeof selectedTimeRange) => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return startDate;
  }, []);

  // Load overview stats
  const loadUsageOverview = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = `usage-overview-${selectedTimeRange}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setUsageOverview(cached.data);
      return;
    }

    setIsLoading(true);

    try {
      console.log('📊 [USAGE] Loading usage overview...');
      const startDate = getDateRange(selectedTimeRange);

      // Load session data from database
      const { data: sessions, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('session_start', startDate.toISOString())
        .order('session_start', { ascending: false })
        .limit(SESSIONS_PER_PAGE);

      if (sessionError) {
        console.error('❌ [USAGE] Error loading sessions:', sessionError);
        throw sessionError;
      }

      console.log('✅ [USAGE] Loaded sessions:', sessions?.length || 0);

      if (!sessions || sessions.length === 0) {
        const emptyOverview = {
          totalSessions: 0,
          uniqueUsers: 0,
          averageSessionDuration: 0,
          totalPageViews: 0,
          bounceRate: 0,
          activeUsers: 0
        };
        setUsageOverview(emptyOverview);
        return;
      }

      // Calculate metrics
      const totalSessions = sessions.length;
      const uniqueUsers = new Set(sessions.map(s => s.username)).size;
      
      // Calculate average session duration (only for completed sessions)
      const completedSessions = sessions.filter(s => s.duration_minutes && s.duration_minutes > 0);
      const averageSessionDuration = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length
        : 0;

      // Calculate total page views
      const totalPageViews = sessions.reduce((sum, s) => sum + (s.pages_visited || 0), 0);
      
      // Calculate bounce rate (sessions with <= 1 page view)
      const bounceSessions = sessions.filter(s => (s.pages_visited || 0) <= 1).length;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

      // Active users (last 24 hours)
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = new Set(
        sessions
          .filter(s => new Date(s.session_start) >= last24Hours)
          .map(s => s.username)
      ).size;

      const overview = {
        totalSessions,
        uniqueUsers,
        averageSessionDuration,
        totalPageViews,
        bounceRate,
        activeUsers
      };

      setUsageOverview(overview);

      // Cache data
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, { data: overview, timestamp: Date.now() });
      setDataCache(newCache);

      console.log('✅ [USAGE] Usage overview loaded:', overview);

    } catch (error) {
      console.error('❌ [USAGE] Error loading usage overview:', error);
      toast.error('Lỗi tải dữ liệu sử dụng');
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, selectedTimeRange, dataCache, getDateRange]);

  // Load device stats
  const loadDeviceStats = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = `device-stats-${selectedTimeRange}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setDeviceStats(cached.data);
      return;
    }

    try {
      console.log('📊 [USAGE] Loading device statistics...');
      const startDate = getDateRange(selectedTimeRange);

      const { data: deviceData, error } = await supabase
        .from('user_sessions')
        .select('device_type')
        .gte('session_start', startDate.toISOString())
        .not('device_type', 'is', null);

      if (!error && deviceData) {
        const deviceCounts: DeviceStats = { desktop: 0, mobile: 0, tablet: 0 };
        
        deviceData.forEach(session => {
          if (session.device_type) {
            const deviceType = session.device_type.toLowerCase();
            if (deviceCounts.hasOwnProperty(deviceType)) {
              deviceCounts[deviceType]++;
            } else {
              deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
            }
          }
        });

        setDeviceStats(deviceCounts);

        // Cache data
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, { data: deviceCounts, timestamp: Date.now() });
        setDataCache(newCache);

        console.log('✅ [USAGE] Device stats loaded:', deviceCounts);
      }
    } catch (error) {
      console.error('❌ [USAGE] Error loading device stats:', error);
    }
  }, [canAccess, selectedTimeRange, dataCache, getDateRange]);

  // Load browser stats
  const loadBrowserStats = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = `browser-stats-${selectedTimeRange}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setBrowserStats(cached.data);
      return;
    }

    try {
      console.log('📊 [USAGE] Loading browser statistics...');
      const startDate = getDateRange(selectedTimeRange);

      const { data: browserData, error } = await supabase
        .from('user_sessions')
        .select('browser_name')
        .gte('session_start', startDate.toISOString())
        .not('browser_name', 'is', null);

      if (!error && browserData) {
        const browserCounts: BrowserStats = {};
        browserData.forEach(session => {
          if (session.browser_name) {
            browserCounts[session.browser_name] = (browserCounts[session.browser_name] || 0) + 1;
          }
        });

        setBrowserStats(browserCounts);

        // Cache data
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, { data: browserCounts, timestamp: Date.now() });
        setDataCache(newCache);

        console.log('✅ [USAGE] Browser stats loaded:', browserCounts);
      }
    } catch (error) {
      console.error('❌ [USAGE] Error loading browser stats:', error);
    }
  }, [canAccess, selectedTimeRange, dataCache, getDateRange]);

  // Load trends data
  const loadTrendsData = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = `trends-data-${selectedTimeRange}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setTimeRangeData(cached.data);
      return;
    }

    try {
      console.log('📊 [USAGE] Loading trends data...');
      const startDate = getDateRange(selectedTimeRange);

      const { data: sessionData, error } = await supabase
        .from('user_sessions')
        .select('session_start, username')
        .gte('session_start', startDate.toISOString())
        .order('session_start', { ascending: true });

      if (!error && sessionData) {
        // Group by day
        const dailyData: { [key: string]: { users: Set<string>; sessions: number } } = {};

        sessionData.forEach(session => {
          const date = new Date(session.session_start);
          const dayKey = date.toISOString().split('T')[0];
          
          if (!dailyData[dayKey]) {
            dailyData[dayKey] = { users: new Set(), sessions: 0 };
          }
          dailyData[dayKey].users.add(session.username);
          dailyData[dayKey].sessions++;
        });

        const daily = Object.entries(dailyData).map(([date, data]) => ({
          date,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.date.localeCompare(b.date));

        const trendsData = {
          hourly: [], // Skip hourly for performance
          daily,
          monthly: [] // Skip monthly for performance
        };

        setTimeRangeData(trendsData);

        // Cache data
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, { data: trendsData, timestamp: Date.now() });
        setDataCache(newCache);

        console.log('✅ [USAGE] Trends data loaded:', { dailyCount: daily.length });
      }
    } catch (error) {
      console.error('❌ [USAGE] Error loading trends data:', error);
    }
  }, [canAccess, selectedTimeRange, dataCache, getDateRange]);

  // Load all data when needed
  const loadUsageData = useCallback(async () => {
    if (!canAccess) return;

    setIsLoading(true);
    try {
      await Promise.all([
        loadUsageOverview(),
        loadDeviceStats(),
        loadBrowserStats(),
        loadTrendsData()
      ]);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, loadUsageOverview, loadDeviceStats, loadBrowserStats, loadTrendsData]);

  // Load data when user has access and time range changes
  useEffect(() => {
    if (canAccess) {
      loadUsageData();
    } else {
      // Clear data if user doesn't have access
      setUsageOverview({
        totalSessions: 0,
        uniqueUsers: 0,
        averageSessionDuration: 0,
        totalPageViews: 0,
        bounceRate: 0,
        activeUsers: 0
      });
      setDeviceStats({ desktop: 0, mobile: 0, tablet: 0 });
      setBrowserStats({});
      setTimeRangeData({ hourly: [], daily: [], monthly: [] });
    }
  }, [canAccess, selectedTimeRange, loadUsageData]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const refreshData = useCallback(() => {
    if (canAccess) {
      // Clear cache
      setDataCache(new Map());
      
      // Reload data
      loadUsageData();
    }
  }, [canAccess, loadUsageData]);

  return {
    usageOverview,
    deviceStats,
    browserStats,
    timeRangeData,
    selectedTimeRange,
    isLoading,
    lastUpdated,
    canAccess,
    setSelectedTimeRange,
    loadUsageData,
    loadDeviceStats,
    loadBrowserStats,
    loadTrendsData,
    refreshData,
    formatDuration
  };
}