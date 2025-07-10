import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUsageStats, getAverageSessionDuration } from '@/utils/usageTracking';

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
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadUsageData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get usage statistics
      const usageStats = await getUsageStats(selectedTimeRange);
      const averageSessionDuration = await getAverageSessionDuration(selectedTimeRange);

      // Get session data
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

      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .gte('session_start', startDate.toISOString())
        .order('session_start', { ascending: true });

      if (error) throw error;

      // Calculate overview stats
      const totalSessions = sessions?.length || 0;
      const uniqueUsers = new Set(sessions?.map(s => s.username) || []).size;
      const totalPageViews = sessions?.reduce((sum, s) => sum + (s.pages_visited || 0), 0) || 0;
      
      // Calculate bounce rate (sessions with only 1 page view)
      const bounceSessions = sessions?.filter(s => s.pages_visited <= 1).length || 0;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

      // Active users (last 24 hours)
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const activeUsers = new Set(
        sessions?.filter(s => new Date(s.session_start) > last24Hours)
          .map(s => s.username) || []
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
      sessions?.forEach(session => {
        if (session.device_type) {
          deviceCounts[session.device_type as keyof DeviceStats]++;
        }
      });
      setDeviceStats(deviceCounts);

      // Browser statistics
      const browserCounts: BrowserStats = {};
      sessions?.forEach(session => {
        if (session.browser_name) {
          browserCounts[session.browser_name] = (browserCounts[session.browser_name] || 0) + 1;
        }
      });
      setBrowserStats(browserCounts);

      // Time range data
      const hourlyData: { [key: string]: { users: Set<string>; sessions: number } } = {};
      const dailyData: { [key: string]: { users: Set<string>; sessions: number } } = {};
      const monthlyData: { [key: string]: { users: Set<string>; sessions: number } } = {};

      sessions?.forEach(session => {
        const date = new Date(session.session_start);
        
        // Hourly data
        const hourKey = `${String(date.getHours()).padStart(2, '0')}:00`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { users: new Set(), sessions: 0 };
        }
        hourlyData[hourKey].users.add(session.username);
        hourlyData[hourKey].sessions++;

        // Daily data
        const dayKey = date.toISOString().split('T')[0];
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { users: new Set(), sessions: 0 };
        }
        dailyData[dayKey].users.add(session.username);
        dailyData[dayKey].sessions++;

        // Monthly data
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { users: new Set(), sessions: 0 };
        }
        monthlyData[monthKey].users.add(session.username);
        monthlyData[monthKey].sessions++;
      });

      setTimeRangeData({
        hourly: Object.entries(hourlyData).map(([hour, data]) => ({
          hour,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.hour.localeCompare(b.hour)),
        
        daily: Object.entries(dailyData).map(([date, data]) => ({
          date,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.date.localeCompare(b.date)),
        
        monthly: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          users: data.users.size,
          sessions: data.sessions
        })).sort((a, b) => a.month.localeCompare(b.month))
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    loadUsageData();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(loadUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadUsageData]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
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
    setSelectedTimeRange,
    loadUsageData,
    formatDuration
  };
}