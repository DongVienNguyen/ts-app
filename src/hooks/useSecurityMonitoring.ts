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

  // Only load data if user is admin
  const canAccess = user?.role === 'admin';

  const loadSecurityData = useCallback(async () => {
    if (!canAccess) {
      console.log('🚫 Access denied: User is not admin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔒 Loading security monitoring data...');

      // Load recent security events only (last 7 days, max 200 records)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: eventData, error: eventError } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (eventError) {
        console.warn('⚠️ Error loading security events:', eventError);
        // Don't throw, just use empty array
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
        return;
      }

      const events = eventData || [];

      // Calculate stats from loaded data
      const totalEvents = events.length;
      const loginAttempts = events.filter(e => e.event_type === 'login_attempt').length;
      const failedLogins = events.filter(e => e.event_type === 'login_failed').length;
      const suspiciousActivity = events.filter(e => 
        e.event_type.includes('suspicious') || 
        e.event_type.includes('blocked') ||
        e.event_type.includes('failed')
      ).length;

      // Count unique blocked IPs
      const blockedIPs = new Set(
        events
          .filter(e => e.event_type.includes('blocked') && e.ip_address)
          .map(e => e.ip_address)
      ).size;

      // Group by event type
      const eventsByType: { [key: string]: number } = {};
      events.forEach(event => {
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
        const count = events.filter(event => 
          event.created_at.startsWith(date)
        ).length;
        eventsByDay.push({ date, count });
      });

      // Recent events (last 20)
      const recentEvents = events.slice(0, 20);

      setStats({
        totalEvents,
        loginAttempts,
        failedLogins,
        suspiciousActivity,
        blockedIPs,
        eventsByType,
        eventsByDay,
        recentEvents
      });

      console.log('✅ Security monitoring data loaded:', {
        totalEvents,
        loginAttempts,
        failedLogins,
        suspiciousActivity,
        blockedIPs
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to load security monitoring data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [canAccess]);

  // Load data only once when component mounts and user has access
  useEffect(() => {
    if (canAccess) {
      loadSecurityData();
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
  }, [canAccess]); // Only depend on canAccess

  // Refresh function for manual refresh
  const refreshData = useCallback(() => {
    if (canAccess) {
      loadSecurityData();
    }
  }, [canAccess, loadSecurityData]);

  return {
    stats,
    isLoading,
    error,
    canAccess,
    refreshData
  };
};