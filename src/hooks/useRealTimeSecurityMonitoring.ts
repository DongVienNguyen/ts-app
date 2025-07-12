import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Changed import
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

export type SecurityEvent = Tables<'security_events'>; // Corrected type
export type SystemAlert = Tables<'system_alerts'>; // Corrected type

interface ThreatTrend {
  date: string;
  successfulLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
}

interface SystemStatus {
  apiConnected: boolean;
  apiResponseTime: number; // in ms
  dbConnected: boolean;
  dbResponseTime: number; // in ms
}

export const useRealTimeSecurityMonitoring = () => {
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [threatTrends, setThreatTrends] = useState<ThreatTrend[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiConnected: false,
    apiResponseTime: 0,
    dbConnected: false,
    dbResponseTime: 0,
  });
  const [securityAlerts, setSecurityAlerts] = useState<SystemAlert[]>([]);

  const logEvent = async (type: string, data: any = {}, username?: string) => { // Added username parameter
    try {
      const { error: insertError } = await supabase
        .from('security_events')
        .insert({ event_type: type, event_data: data, username: username }); // Included username

      if (insertError) {
        console.error('Error logging security event:', insertError);
      }
    } catch (err) {
      console.error('Exception logging security event:', err);
    }
  };

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let alertsChannel: RealtimeChannel | null = null; // Declare alertsChannel

    const setupRealtime = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch initial data
        const { data: initialEvents, error: eventsError } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (eventsError) throw eventsError;
        setRecentEvents(initialEvents || []);

        const { data: initialAlerts, error: alertsError } = await supabase
          .from('system_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (alertsError) throw alertsError;
        setSecurityAlerts(initialAlerts || []);

        // Simulate system status and active users
        setSystemStatus({
          apiConnected: true,
          apiResponseTime: Math.floor(Math.random() * 100) + 20, // 20-120ms
          dbConnected: true,
          dbResponseTime: Math.floor(Math.random() * 80) + 10, // 10-90ms
        });
        setActiveUsers(Math.floor(Math.random() * 20) + 5); // 5-25 active users

        setIsSupabaseConnected(true);

        // Setup real-time channel for security events
        channel = supabase
          .channel('security_events_channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'security_events' },
            (payload) => {
              const newEvent = payload.new as SecurityEvent; // Explicitly cast
              setRecentEvents((prev) => [newEvent, ...prev].slice(0, 50));
              toast.info(`Sự kiện bảo mật mới: ${newEvent.event_type}`);
            }
          )
          .subscribe();

        // Setup real-time channel for system alerts
        alertsChannel = supabase // Assign to alertsChannel
          .channel('system_alerts_channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'system_alerts' },
            (payload) => {
              const newAlert = payload.new as SystemAlert; // Explicitly cast
              setSecurityAlerts((prev) => [newAlert, ...prev].slice(0, 10));
              toast.warning(`Cảnh báo hệ thống mới: ${newAlert.rule_name}`);
            }
          )
          .subscribe();

      } catch (err: any) {
        console.error('Error setting up real-time monitoring:', err.message);
        setError(`Lỗi tải dữ liệu: ${err.message}`);
        setIsSupabaseConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (alertsChannel) { // Remove alertsChannel if it was created
        supabase.removeChannel(alertsChannel);
      }
    };
  }, [supabase]);

  // Simulate threat trends based on recent events
  useEffect(() => {
    const generateThreatTrends = () => {
      const today = new Date();
      const trends: ThreatTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const dailyEvents = recentEvents.filter(event =>
          new Date(event.created_at!).toISOString().split('T')[0] === dateString // Use non-null assertion
        );

        trends.push({
          date: dateString,
          successfulLogins: dailyEvents.filter(e => e.event_type === 'LOGIN_SUCCESS').length,
          failedLogins: dailyEvents.filter(e => e.event_type === 'LOGIN_FAILED').length,
          suspiciousActivities: dailyEvents.filter(e => e.event_type === 'SUSPICIOUS_ACTIVITY' || e.event_type === 'RATE_LIMIT_EXCEEDED').length,
        });
      }
      setThreatTrends(trends);
    };

    generateThreatTrends();
  }, [recentEvents]);

  return {
    recentEvents,
    threatTrends,
    isSupabaseConnected,
    isLoading,
    error,
    logEvent,
    activeUsers,
    systemStatus,
    securityAlerts,
  };
};