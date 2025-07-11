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

  // Only load data if user is admin
  const canAccess = user?.role === 'admin';

  const loadUsageData = useCallback(async () => {
    if (!canAccess) {
      console.log('🚫 Access denied: User is not admin');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📊 Loading usage monitoring data...');

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

      // Load session data with limit to prevent performance issues
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('session_start', startDate.toISOString())
        .order('session_start', { ascending: false })
        .limit(1000); // Limit to prevent performance issues

      if (error) {
        console.warn('⚠️ Error loading user sessions:', error);
        // Don't throw, just use empty array
        setUsageOverview({
          totalSessions: 0,
          uniqueUsers: 0,
          averageSessionDuration: 0,
          totalPageViews: 0,
          bounceRate: 0,
          activeUsers: 0
        });
        return;
      }

      const sessionList = sessions || [];

      // Calculate overview stats
      const totalSessions = sessionList.length;
      const uniqueUsers = new Set(sessionList.map(s => s.username)).size;
      const totalPageViews = sessionList.reduce((sum, s) => sum + (s.pages_visited || 0), 0);
      
      // Calculate average session duration
      const completedSessions = sessionList.filter(s => s.duration_minutes);
      const averageSessionDuration = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / completedSessions.length
        : 0;
      
      // Calculate bounce rate (sessions with only 1 page view)
      const bounceSessions = sessionList.filter(s => s.pages_visited <= 1).length;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

      // Active users (last 24 hours)
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const activeUsers = new Set(
        sessionList.filter(s => new Date(s.session_start) > last24Hours)
          .map(s => s.username)
      ).size;

      setUsageOverview({
        totalSessions,
        uniqueUsers,
        averageSessionDuration,
        totalPageViews,
        bounceRate,
        activeUsers
      });

      // Device statistics
      const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
      sessionList.forEach(session => {
        if (session.device_type && deviceCounts.hasOwnProperty(session.device_type)) {
          deviceCounts[session.device_type as keyof DeviceStats]++;
        }
      });
      setDeviceStats(deviceCounts);

      // Browser statistics
      const browserCounts: BrowserStats = {};
      sessionList.forEach(session => {
        if (session.browser_name) {
          browserCounts[session.browser_name] = (browserCounts[session.browser_name] || 0) + 1;
        }
      });
      setBrowserStats(browserCounts);

      // Time range data (simplified to prevent performance issues)
      const dailyData: { [key: string]: { users: Set<string>; sessions: number } } = {};

      sessionList.forEach(session => {
        const date = new Date(session.session_start);
        const dayKey = date.toISOString().split('T')[0];
        
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { users: new Set(), sessions: 0 };
        }
        dailyData[dayKey].users.add(session.username);
        dailyData[dayKey].sessions++;
      });

      setTimeRangeData({
        hourly: [], // Skip hourly for performance
        daily: Object.entries(dailyData).map(([date, data]) => ({
          date,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.date.localeCompare(b.date)),
        monthly: [] // Skip monthly for performance
      });

      setLastUpdated(new Date());
      console.log('✅ Usage monitoring data loaded:', {
        totalSessions,
        uniqueUsers,
        averageSessionDuration: Math.round(averageSessionDuration),
        activeUsers
      });

    } catch (error) {
      console.error('❌ Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, selectedTimeRange]);

  // Load data only when user has access
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
  }, [canAccess, selectedTimeRange]); // Depend on both canAccess and selectedTimeRange

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

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
    formatDuration
  };
}