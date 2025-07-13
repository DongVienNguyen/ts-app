import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { AuthenticatedStaff } from '@/contexts/AuthContext';
import { logSecurityEventRealTime } from '@/utils/realTimeSecurityUtils';
import { systemHealthAlertService } from '@/services/systemHealthAlertService';

export type SecurityEvent = Tables<'security_events'>;
export type SystemAlert = Tables<'system_alerts'>;

interface ThreatTrend {
  date: string;
  successfulLogins: number;
  failedLogins: number;
  suspiciousActivities: number;
}

interface SystemStatus {
  apiConnected: boolean;
  apiResponseTime: number;
  dbConnected: boolean;
  dbResponseTime: number;
}

export const useRealTimeSecurityMonitoring = (user: AuthenticatedStaff | null) => {
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [threatTrends, setThreatTrends] = useState<ThreatTrend[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiConnected: false,
    apiResponseTime: 0,
    dbConnected: false,
    dbResponseTime: 0,
  });
  const [securityAlerts, setSecurityAlerts] = useState<SystemAlert[]>([]);
  
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const isMountedRef = useRef(true);

  const logEvent = async (type: string, data: any = {}, username?: string) => {
    console.log(`🔄 [SECURITY] Logging event: ${type}`, { data, username });
    await logSecurityEventRealTime(type, data, username);
  };

  const refreshEvents = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsRefreshing(true);
    console.log('🔄 [REFRESH] Refreshing events only...');
    
    try {
      const { data: freshEvents, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Tăng giới hạn để tính toán chính xác hơn

      if (eventsError) {
        console.error('❌ [REFRESH] Error refreshing events:', eventsError);
        toast.error('Lỗi làm mới dữ liệu');
        return;
      }

      if (isMountedRef.current) {
        console.log('✅ [REFRESH] Refreshed events:', freshEvents?.length || 0);
        setRecentEvents(freshEvents || []);
        setForceUpdateCounter(prev => prev + 1);
        toast.success('Đã làm mới dữ liệu');
      }
    } catch (err: any) {
      console.error('❌ [REFRESH] Refresh failed:', err);
      toast.error('Lỗi làm mới dữ liệu');
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [user]);

  const handleNewSecurityEvent = useCallback((payload: any) => {
    console.log('🎉 [REALTIME] New security event received:', payload);
    const newEvent = payload.new as SecurityEvent;
    
    if (!isMountedRef.current) {
      console.log('⚠️ [REALTIME] Component unmounted, ignoring event');
      return;
    }
    
    setRecentEvents((prevEvents) => {
      if (!isMountedRef.current) return prevEvents;
      
      const eventExists = prevEvents.some(event => event.id === newEvent.id);
      if (eventExists) {
        return prevEvents;
      }
      
      const updated = [newEvent, ...prevEvents].slice(0, 100);
      
      setTimeout(() => {
        if (isMountedRef.current) {
          setForceUpdateCounter(prev => prev + 1);
        }
      }, 0);
      
      return updated;
    });
    
    toast.info(`Sự kiện bảo mật mới: ${newEvent.event_type}`, {
      description: `Từ: ${newEvent.username || 'Không xác định'}`,
      duration: 4000,
    });
  }, []);

  const handleNewSystemAlert = useCallback((payload: any) => {
    console.log('🚨 [REALTIME] New system alert received:', payload);
    const newAlert = payload.new as SystemAlert;
    
    if (!isMountedRef.current) return;
    
    setSecurityAlerts((prevAlerts) => {
      if (!isMountedRef.current) return prevAlerts;
      
      const updated = [newAlert, ...prevAlerts].slice(0, 10);
      return updated;
    });
    
    toast.warning(`Cảnh báo hệ thống mới: ${newAlert.rule_name}`, {
      duration: 5000,
    });
  }, []);

  const acknowledgeSystemAlert = useCallback(async (alertId: string) => {
    if (!user) return;
    const success = await systemHealthAlertService.acknowledgeAlert(alertId, user.username);
    if (success) {
      toast.success('Đã giải quyết cảnh báo thành công.');
      setSecurityAlerts(prev => prev.filter(a => a.id !== alertId));
    } else {
      toast.error('Không thể giải quyết cảnh báo.');
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!user || user.role !== 'admin') {
      setIsLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;
    let alertsChannel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: initialEvents, error: eventsError } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (eventsError) throw eventsError;
        if (!isMountedRef.current) return;
        setRecentEvents(initialEvents || []);

        const { data: initialAlerts, error: alertsError } = await supabase
          .from('system_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (alertsError) console.error('❌ [REALTIME] Error loading initial alerts:', alertsError);
        else if (isMountedRef.current) setSecurityAlerts(initialAlerts || []);

        if (!isMountedRef.current) return;

        setSystemStatus({
          apiConnected: true,
          apiResponseTime: Math.floor(Math.random() * 100) + 20,
          dbConnected: true,
          dbResponseTime: Math.floor(Math.random() * 80) + 10,
        });
        setIsSupabaseConnected(true);

        const securityChannelName = `security_events_${user.username}_${Date.now()}`;
        channel = supabase
          .channel(securityChannelName)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, handleNewSecurityEvent)
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR') setError(`Lỗi kênh real-time: ${err?.message}`);
          });

        const alertsChannelName = `system_alerts_${user.username}_${Date.now()}`;
        alertsChannel = supabase
          .channel(alertsChannelName)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_alerts' }, handleNewSystemAlert)
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR') setError(`Lỗi kênh cảnh báo: ${err?.message}`);
          });

      } catch (err: any) {
        console.error('❌ [REALTIME] Error setting up real-time monitoring:', err);
        if (isMountedRef.current) {
          setError(`Lỗi tải dữ liệu: ${err.message}`);
          setIsSupabaseConnected(false);
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    setupRealtime();

    return () => {
      isMountedRef.current = false;
      if (channel) supabase.removeChannel(channel);
      if (alertsChannel) supabase.removeChannel(alertsChannel);
    };
  }, [user, handleNewSecurityEvent, handleNewSystemAlert]);

  useEffect(() => {
    // Generate Threat Trends
    const today = new Date();
    const trends: ThreatTrend[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dailyEvents = recentEvents.filter(event => new Date(event.created_at!).toISOString().split('T')[0] === dateString);
      trends.push({
        date: dateString,
        successfulLogins: dailyEvents.filter(e => e.event_type === 'LOGIN_SUCCESS').length,
        failedLogins: dailyEvents.filter(e => e.event_type === 'LOGIN_FAILED').length,
        suspiciousActivities: dailyEvents.filter(e => e.event_type === 'SUSPICIOUS_ACTIVITY' || e.event_type === 'RATE_LIMIT_EXCEEDED').length,
      });
    }
    setThreatTrends(trends);

    // Calculate Active Users (last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).getTime();
    const activeUsernames = new Set(
      recentEvents
        .filter(event => event.created_at && new Date(event.created_at).getTime() > fifteenMinutesAgo)
        .map(event => event.username)
        .filter((username): username is string => username !== null)
    );
    setActiveUsers(activeUsernames.size);
    console.log(`✅ [REALTIME] Calculated active users (last 15 min): ${activeUsernames.size}`);

  }, [recentEvents, forceUpdateCounter]);

  return {
    recentEvents,
    threatTrends,
    isSupabaseConnected,
    isLoading,
    isRefreshing,
    error,
    logEvent,
    refreshEvents,
    activeUsers,
    systemStatus,
    securityAlerts,
    forceUpdateCounter,
    acknowledgeSystemAlert,
  };
};