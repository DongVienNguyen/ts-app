import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityEvent } from '@/utils/realTimeSecurityUtils';
import { logSecurityEventRealTime } from '@/utils/realTimeSecurityUtils';
import { CONNECTION_STATE } from '@supabase/supabase-js'; // Import CONNECTION_STATE

export interface RealTimeSecurityStats {
  activeUsers: number;
  recentEvents: SecurityEvent[];
  threatTrends: { date: string; successfulLogins: number; failedLogins: number; suspiciousActivities: number }[];
  isSupabaseConnected: boolean; // Add this to the interface
}

export function useRealTimeSecurityMonitoring() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [threatTrends, setThreatTrends] = useState<{ date: string; successfulLogins: number; failedLogins: number; suspiciousActivities: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false); // New state for connection status

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch initial recent events (e.g., last 20 events)
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
        setRecentEvents(mappedEvents); // This now correctly receives an array
        updateThreatTrends(mappedEvents);

        // For active users, we might need a more sophisticated method,
        // for now, let's simulate or fetch from a 'user_sessions' table if available.
        // Assuming 'user_sessions' table exists and tracks active sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('user_sessions')
          .select('id')
          .is('session_end', null);

        if (sessionError) {
            // Log the warning, but don't throw an error that stops the dashboard
            console.warn("Could not fetch active sessions:", sessionError.message);
            setActiveUsers(0); // Default to 0 if error
        } else {
            setActiveUsers(sessions?.length || 0);
        }

      } catch (err: any) {
        setError('Failed to fetch initial data: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time subscription for security_events
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
          setRecentEvents(prevEvents => {
            const updatedEvents = [mappedNewEvent, ...prevEvents].slice(0, 20); // Keep only the latest 20
            updateThreatTrends(updatedEvents);
            return updatedEvents;
          });
        }
      )
      .subscribe();

    // Set up real-time subscription for user_sessions (if applicable)
    const userSessionsChannel = supabase
      .channel('user_sessions_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_sessions' }, // Listen to all changes for active user count
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

    // --- Supabase Realtime Connection Status Monitoring ---
    const handleConnect = () => setIsSupabaseConnected(true);
    const handleDisconnect = () => setIsSupabaseConnected(false);

    // Initial check
    setIsSupabaseConnected(supabase.realtime.connectionState() === CONNECTION_STATE.CONNECTED);

    // Listen for global real-time connection status changes
    supabase.realtime.on('CONNECT', handleConnect);
    supabase.realtime.on('DISCONNECT', handleDisconnect);

    return () => {
      supabase.removeChannel(securityEventsChannel);
      supabase.removeChannel(userSessionsChannel);
      // Unsubscribe from global real-time connection status changes
      supabase.realtime.off('CONNECT', handleConnect);
      supabase.realtime.off('DISCONNECT', handleDisconnect);
    };
  }, []);

  const updateThreatTrends = (events: SecurityEvent[]) => {
    const dailyData: { [date: string]: { successfulLogins: number; failedLogins: number; suspiciousActivities: number } } = {};

    events.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-CA'); // Use 'en-CA' for YYYY-MM-DD format
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

    // Sort dates to ensure correct order in chart
    const sortedDates = Object.keys(dailyData).sort();
    const newTrends = sortedDates.map(date => ({ date, ...dailyData[date] }));
    setThreatTrends(newTrends);
  };

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
    isSupabaseConnected, // Export the new state
  };
}