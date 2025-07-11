import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  id: string;
  event_type: string;
  username?: string;
  event_data?: any;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

interface SecurityStats {
  totalEvents: number;
  loginAttempts: number;
  failedLogins: number;
  suspiciousActivity: number;
  blockedIPs: number;
  eventsByType: { [key: string]: number };
  eventsByDay: { date: string; count: number }[];
  recentEvents: SecurityEvent[];
}

const EVENTS_PER_PAGE = 20;
const CACHE_DURATION = 3 * 60 * 1000; // 3 phút

export const useSecurityMonitoring = () => {
  const { user } = useSecureAuth();
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    loginAttempts: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    blockedIPs: 0,
    eventsByType: {},
    eventsByDay: [],
    recentEvents: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEventCount, setTotalEventCount] = useState(0);

  // Cache system
  const [dataCache, setDataCache] = useState<Map<string, { data: any, timestamp: number }>>(new Map());

  // Only load data if user is admin
  const canAccess = user?.role === 'admin';

  // Load basic security stats
  const loadSecurityStats = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = 'security-stats';
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setStats(prev => ({ ...prev, ...cached.data }));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔒 Loading security stats...');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Load basic counts
      const [
        { count: totalEvents },
        { count: loginAttempts },
        { count: failedLogins },
        { count: suspiciousActivity }
      ] = await Promise.all([
        supabase
          .from('security_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('security_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'login_attempt')
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('security_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'login_failed')
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('security_events')
          .select('*', { count: 'exact', head: true })
          .or('event_type.like.*suspicious*,event_type.like.*blocked*,event_type.like.*failed*')
          .gte('created_at', sevenDaysAgo.toISOString())
      ]);

      const basicStats = {
        totalEvents: totalEvents || 0,
        loginAttempts: loginAttempts || 0,
        failedLogins: failedLogins || 0,
        suspiciousActivity: suspiciousActivity || 0,
        blockedIPs: 0 // Will be calculated when needed
      };

      setStats(prev => ({ ...prev, ...basicStats }));
      setTotalEventCount(totalEvents || 0);

      // Cache basic stats
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, { data: basicStats, timestamp: Date.now() });
      setDataCache(newCache);

      console.log('✅ Security stats loaded:', basicStats);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to load security stats:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess, dataCache]);

  // Load recent events với phân trang
  const loadRecentEvents = useCallback(async (page: number = 1) => {
    if (!canAccess) return;

    const cacheKey = `recent-events-${page}`;
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setStats(prev => ({ ...prev, recentEvents: cached.data }));
      return;
    }

    try {
      console.log(`🔒 Loading recent events - Page ${page}...`);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const from = (page - 1) * EVENTS_PER_PAGE;
      const to = from + EVENTS_PER_PAGE - 1;

      const { data: events, error } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.warn('⚠️ Error loading recent events:', error);
        return;
      }

      const eventList = events || [];
      setStats(prev => ({ ...prev, recentEvents: eventList }));

      // Cache data
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, { data: eventList, timestamp: Date.now() });
      setDataCache(newCache);

      console.log(`✅ Recent events loaded: ${eventList.length} records`);

    } catch (error) {
      console.error('❌ Error loading recent events:', error);
    }
  }, [canAccess, dataCache]);

  // Load detailed analytics - chỉ khi user click vào tab Summary
  const loadDetailedAnalytics = useCallback(async () => {
    if (!canAccess) return;

    const cacheKey = 'security-analytics';
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setStats(prev => ({ ...prev, ...cached.data }));
      return;
    }

    try {
      console.log('🔒 Loading detailed analytics...');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Load events for analysis
      const { data: events, error } = await supabase
        .from('security_events')
        .select('event_type, ip_address, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(200); // Limit để tránh load quá nhiều

      if (error) {
        console.warn('⚠️ Error loading events for analytics:', error);
        return;
      }

      const eventList = events || [];

      // Calculate blocked IPs
      const blockedIPs = new Set(
        eventList
          .filter(e => e.event_type.includes('blocked') && e.ip_address)
          .map(e => e.ip_address)
      ).size;

      // Group by event type
      const eventsByType: { [key: string]: number } = {};
      eventList.forEach(event => {
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      });

      // Group by day (last 7 days)
      const eventsByDay: { date: string; count: number }[] = [];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(date => {
        const count = eventList.filter(event => 
          event.created_at.startsWith(date)
        ).length;
        eventsByDay.push({ date, count });
      });

      const analytics = {
        blockedIPs,
        eventsByType,
        eventsByDay
      };

      setStats(prev => ({ ...prev, ...analytics }));

      // Cache data
      const newCache = new Map(dataCache);
      newCache.set(cacheKey, { data: analytics, timestamp: Date.now() });
      setDataCache(newCache);

      console.log('✅ Detailed analytics loaded');

    } catch (error) {
      console.error('❌ Error loading detailed analytics:', error);
    }
  }, [canAccess, dataCache]);

  // Load data only once when component mounts and user has access
  useEffect(() => {
    if (canAccess) {
      loadSecurityStats();
    } else {
      // Clear data if user doesn't have access
      setStats({
        totalEvents: 0,
        loginAttempts: 0,
        failedLogins: 0,
        suspiciousActivity: 0,
        blockedIPs: 0,
        eventsByType: {},
        eventsByDay: [],
        recentEvents: []
      });
    }
  }, [canAccess, loadSecurityStats]);

  // Load recent events when page changes
  useEffect(() => {
    if (canAccess) {
      loadRecentEvents(currentPage);
    }
  }, [canAccess, currentPage, loadRecentEvents]);

  // Refresh function for manual refresh
  const refreshData = useCallback(() => {
    if (canAccess) {
      // Clear cache
      setDataCache(new Map());
      
      // Reload data
      loadSecurityStats();
      loadRecentEvents(currentPage);
    }
  }, [canAccess, currentPage, loadSecurityStats, loadRecentEvents]);

  return {
    stats,
    isLoading,
    error,
    canAccess,
    currentPage,
    setCurrentPage,
    totalEventCount,
    totalPages: Math.ceil(totalEventCount / EVENTS_PER_PAGE),
    refreshData,
    loadDetailedAnalytics
  };
};