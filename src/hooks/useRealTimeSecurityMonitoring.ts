import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityEvent } from '@/utils/realTimeSecurityUtils';
import { logSecurityEventRealTime } from '@/utils/realTimeSecurityUtils';

export interface RealTimeSecurityStats {
  activeUsers: number;
  recentEvents: SecurityEvent[];
  threatTrends: { date: string; successfulLogins: number; failedLogins: number; suspiciousActivities: number }[];
  isSupabaseConnected: boolean;
}

export function useRealTimeSecurityMonitoring() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);

  const threatTrends = useMemo(() => {
    const dailyData: { [date: string]: { successfulLogins: number; failedLogins: number; suspiciousActivities: number } } = {};

    recentEvents.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD format
      if (!dailyData[date]) {
        dailyData[date] = { successfulLogins: 0, failedLogins: 0, suspiciousActivities: 0 };
      }

      if (event.type === 'LOGIN_SUCCESS') {
        dailyData[date].successfulLogins++;
      } else if (event.type === 'LOGIN_FAILED') {
        dailyData[date].failedLogins++;
      } else if (event.type === 'SUSPICIOUS_ACTIVITY' || event.type === 'RATE_LIMIT_EXCEEDED') {
        dailyData[date].suspiciousActivities++;
      }
    });

    const sortedDates = Object.keys(dailyData).sort();
    const newTrends = sortedDates.map(date => ({ date, ...dailyData[date] }));
    return newTrends;
  }, [recentEvents]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: events, error: fetchError } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (fetchError) throw fetchError;

        const mappedEvents: SecurityEvent[] = events.map(event => ({
          id: event.id,
          type: event.event_type,
          timestamp: event.created_at,
          data: event.event_data,
          userAgent: event.user_agent,
          ip: event.ip_address,
          username: event.username
        }));
        setRecentEvents(mappedEvents);

        const { data: sessions, error: sessionError } = await supabase
          .from('user_sessions')
          .select('id')
          .is('session_end', null);

        if (sessionError) {
            console.warn("Could not fetch active sessions:", sessionError.message);
            setActiveUsers(0);
        } else {
            setActiveUsers(sessions?.length || 0);
        }

        setIsSupabaseConnected(true);

      } catch (err: any) {
        setError('Failed to fetch initial data: ' + err.message);
        setIsSupabaseConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const securityEventsChannel = supabase
      .channel('security_events_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          const newEvent = payload.new as any;
          const mappedNewEvent: SecurityEvent = {
            id: newEvent.id,
            type: newEvent.event_type,
            timestamp: newEvent.created_at,
            data: newEvent.event_data,
            userAgent: newEvent.user_agent,
            ip: newEvent.ip_address,
            username: newEvent.username
          };
          setRecentEvents(prevEvents => [mappedNewEvent, ...prevEvents].slice(0, 20));
          setIsSupabaseConnected(true);
        }
      )
      .subscribe();

    const userSessionsChannel = supabase
      .channel('user_sessions_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_sessions' },
        async () => {
          const { data: sessions, error: sessionError } = await supabase
            .from('user_sessions')
            .select('id')
            .is('session_end', null);

          if (sessionError) {
            console.warn("Could not update active sessions via real-time:", sessionError.message);
          } else {
            setActiveUsers(sessions?.length || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(securityEventsChannel);
      supabase.removeChannel(userSessionsChannel);
    };
  }, []);

  const logEvent = async (eventType: string, data: any = {}, username?: string) => {
    await logSecurityEventRealTime(eventType, data, username);
  };

  return {
    activeUsers,
    recentEvents,
    threatTrends,
    isLoading,
    error,
    logEvent,
    isSupabaseConnected,
  };
}