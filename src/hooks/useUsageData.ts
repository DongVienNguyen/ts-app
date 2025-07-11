import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';

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
}

interface BrowserStats {
  [browser: string]: number;
}

interface TimeRangeData {
  hourly: { hour: string; users: number; sessions: number }[];
  daily: { date: string; users: number; sessions: number }[];
  monthly: { month: string; users: number; sessions: number }[];
}

const SESSIONS_PER_PAGE = 50;
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

  // Load overview stats - always needed
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
      console.log('📊 Loading usage overview...');

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (selectedTimeRange) {
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

      // Load basic session counts
      const { count: totalSessions, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('session_start', startDate.toISOString());

      if (sessionError) {
        console.warn('⚠️ Error loading session count:', sessionError);
        return;
      }

      // Load unique users count
      const { data: uniqueUsersData } = await supabase
        .from('user_sessions')
        .select('username')
        .gte('session_start', startDate.toISOString());

      const uniqueUsers = uniqueUsersData ? new Set(uniqueUsersData.map(s => s.username)).size : 0;

      // Load sample sessions for calculations (limit to prevent performance issues)
      const { data: sampleSessions, error: sampleError } = await supabase
        .from('user_sessions')
        .select('duration_minutes, pages_visited')
        .gte('session_start', startDate.toISOString())
        .not('duration_minutes', 'is', null)
        .limit(SESSIONS_PER_PAGE);

      let averageSessionDuration = 0;
      let totalPageViews = 0;
      let bounceRate = 0;

      if (!sampleError && sampleSessions) {
        const completedSessions = sampleSessions.filter(s => s.duration_minutes);
        averageSessionDuration = completedSessions.length > 0
          ? completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length
          : 0;

        totalPageViews = sampleSessions.reduce((sum, s) => sum + (s.pages_visited || 0), 0);
        
        const bounceSessions = sampleSessions.filter(s => s.pages_visited <= 1).length;
        bounceRate = sampleSessions.length > 0 ? (bounceSessions / sampleSessions.length) * 100 : 0;
      }

      // Active users (last 24 hours)
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { data: activeUsersData } = await supabase
        .from('user_sessions')
        .select('username')
        .gte('session_start', last24Hours.toISOString());

      const activeUsers = activeUsersData ? new Set(activeUsersData.map(s => s.username)).size : 0;

      const overview = {
        totalSessions: totalSessions || 0,
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

      console.log('✅ Usage overview loaded:', overview);

    } catch (error) {
      console.error('❌ Error loading usage overview:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, selectedTimeRange, dataCache]);

  // Load device stats - only when needed
  const loadDeviceStats = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = `device-stats-${selectedTimeRange}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setDeviceStats(cached.data);
      return;
    }

    try {
      console.log('📊 Loading device statistics...');

      const now = new Date();
      let startDate: Date;

      switch (selectedTimeRange) {
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

      const { data: deviceData, error } = await supabase
        .from('user_sessions')
        .select('device_type')
        .gte('session_start', startDate.toISOString())
        .not('device_type', 'is', null)
        .limit(200); // Limit để tránh load quá nhiều

      if (!error && deviceData) {
        const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
        deviceData.forEach(session => {
          if (session.device_type && deviceCounts.hasOwnProperty(session.device_type)) {
            deviceCounts[session.device_type as keyof DeviceStats]++;
          }
        });

        setDeviceStats(deviceCounts);

        // Cache data
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, { data: deviceCounts, timestamp: Date.now() });
        setDataCache(newCache);
      }
    } catch (error) {
      console.error('❌ Error loading device stats:', error);
    }
  }, [canAccess, selectedTimeRange, dataCache]);

  // Load browser stats - only when needed
  const loadBrowserStats = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = `browser-stats-${selectedTimeRange}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setBrowserStats(cached.data);
      return;
    }

    try {
      console.log('📊 Loading browser statistics...');

      const now = new Date();
      let startDate: Date;

      switch (selectedTimeRange) {
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

      const { data: browserData, error } = await supabase
        .from('user_sessions')
        .select('browser_name')
        .gte('session_start', startDate.toISOString())
        .not('browser_name', 'is', null)
        .limit(200); // Limit để tránh load quá nhiều

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
      }
    } catch (error) {
      console.error('❌ Error loading browser stats:', error);
    }
  }, [canAccess, selectedTimeRange, dataCache]);

  // Load trends data - only when needed
  const loadTrendsData = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = `trends-data-${selectedTimeRange}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setTimeRangeData(cached.data);
      return;
    }

    try {
      console.log('📊 Loading trends data...');

      const now = new Date();
      let startDate: Date;

      switch (selectedTimeRange) {
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

      // Load limited session data for trends
      const { data: sessionData, error } = await supabase
        .from('user_sessions')
        .select('session_start, username')
        .gte('session_start', startDate.toISOString())
        .order('session_start', { ascending: true })
        .limit(500); // Limit để tránh load quá nhiều

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
      }
    } catch (error) {
      console.error('❌ Error loading trends data:', error);
    }
  }, [canAccess, selectedTimeRange, dataCache]);

  // Load data only when user has access and time range changes
  useEffect(() => {
    if (canAccess) {
      loadUsageOverview();
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
  }, [canAccess, selectedTimeRange, loadUsageOverview]);

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
      
      // Reload overview
      loadUsageOverview();
      setLastUpdated(new Date());
    }
  }, [canAccess, loadUsageOverview]);

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
    loadUsageData: loadUsageOverview,
    loadDeviceStats,
    loadBrowserStats,
    loadTrendsData,
    refreshData,
    formatDuration
  };
}