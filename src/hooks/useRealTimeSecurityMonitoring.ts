import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { AuthenticatedStaff } from '@/contexts/AuthContext';
import { logSecurityEventRealTime } from '@/utils/realTimeSecurityUtils';

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

  // Ref để theo dõi mounted state
  const isMountedRef = useRef(true);

  const logEvent = async (type: string, data: any = {}, username?: string) => {
    console.log(`🔄 [SECURITY] Logging event: ${type}`, { data, username });
    await logSecurityEventRealTime(type, data, username);
  };

  // Function để refresh chỉ events
  const refreshEvents = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    
    setIsRefreshing(true);
    console.log('🔄 [REFRESH] Refreshing events only...');
    
    try {
      const { data: freshEvents, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('❌ [REFRESH] Error refreshing events:', eventsError);
        toast.error('Lỗi làm mới dữ liệu');
        return;
      }

      if (isMountedRef.current) {
        console.log('✅ [REFRESH] Refreshed events:', freshEvents?.length || 0);
        setRecentEvents(freshEvents || []);
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

  // Callback để xử lý sự kiện mới - sử dụng ref để tránh stale closure
  const handleNewSecurityEvent = useCallback((payload: any) => {
    console.log('🎉 [REALTIME] New security event received:', payload);
    const newEvent = payload.new as SecurityEvent;
    
    if (!isMountedRef.current) {
      console.log('⚠️ [REALTIME] Component unmounted, ignoring event');
      return;
    }
    
    // Force update với functional update
    setRecentEvents((prevEvents) => {
      if (!isMountedRef.current) return prevEvents;
      
      // Kiểm tra xem event đã tồn tại chưa để tránh duplicate
      const eventExists = prevEvents.some(event => event.id === newEvent.id);
      if (eventExists) {
        console.log('⚠️ [REALTIME] Event already exists, skipping');
        return prevEvents;
      }
      
      const updated = [newEvent, ...prevEvents].slice(0, 50);
      console.log('📝 [REALTIME] Updated events list, total:', updated.length);
      console.log('📝 [REALTIME] New event added:', newEvent.event_type, newEvent.username);
      return updated;
    });
    
    // Hiển thị toast notification
    toast.info(`Sự kiện bảo mật mới: ${newEvent.event_type}`, {
      description: `Từ: ${newEvent.username || 'Không xác định'}`,
      duration: 4000,
    });
  }, []);

  // Callback để xử lý alert mới
  const handleNewSystemAlert = useCallback((payload: any) => {
    console.log('🚨 [REALTIME] New system alert received:', payload);
    const newAlert = payload.new as SystemAlert;
    
    if (!isMountedRef.current) return;
    
    setSecurityAlerts((prevAlerts) => {
      if (!isMountedRef.current) return prevAlerts;
      
      const updated = [newAlert, ...prevAlerts].slice(0, 10);
      console.log('🚨 [REALTIME] Updated alerts list, total:', updated.length);
      return updated;
    });
    
    toast.warning(`Cảnh báo hệ thống mới: ${newAlert.rule_name}`, {
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!user || user.role !== 'admin') {
      console.log('❌ [REALTIME] User not admin or not logged in', { user: user?.username, role: user?.role });
      setIsLoading(false);
      setIsSupabaseConnected(false);
      setRecentEvents([]);
      setSecurityAlerts([]);
      return;
    }

    console.log('🚀 [REALTIME] Setting up real-time monitoring for admin user:', user.username);

    let channel: RealtimeChannel | null = null;
    let alertsChannel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('📊 [REALTIME] Loading initial security events...');
        
        // Load initial events
        const { data: initialEvents, error: eventsError } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (eventsError) {
          console.error('❌ [REALTIME] Error loading initial events:', eventsError);
          throw eventsError;
        }

        if (!isMountedRef.current) return;

        console.log('✅ [REALTIME] Loaded initial events:', initialEvents?.length || 0);
        setRecentEvents(initialEvents || []);

        // Load initial alerts
        const { data: initialAlerts, error: alertsError } = await supabase
          .from('system_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (alertsError) {
          console.error('❌ [REALTIME] Error loading initial alerts:', alertsError);
        } else if (isMountedRef.current) {
          console.log('✅ [REALTIME] Loaded initial alerts:', initialAlerts?.length || 0);
          setSecurityAlerts(initialAlerts || []);
        }

        if (!isMountedRef.current) return;

        // Set system status
        setSystemStatus({
          apiConnected: true,
          apiResponseTime: Math.floor(Math.random() * 100) + 20,
          dbConnected: true,
          dbResponseTime: Math.floor(Math.random() * 80) + 10,
        });
        setActiveUsers(Math.floor(Math.random() * 20) + 5);
        setIsSupabaseConnected(true);

        // Setup real-time subscription for security events
        const securityChannelName = `security_events_${Date.now()}_${Math.random()}`;
        console.log(`🔗 [REALTIME] Creating security events channel: ${securityChannelName}`);
        
        channel = supabase
          .channel(securityChannelName)
          .on(
            'postgres_changes',
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'security_events' 
            },
            handleNewSecurityEvent
          )
          .subscribe((status, err) => {
            console.log(`📡 [REALTIME] Security channel status: ${status}`);
            if (status === 'SUBSCRIBED') {
              console.log(`✅ [REALTIME] Successfully subscribed to ${securityChannelName}`);
            }
            if (status === 'CHANNEL_ERROR') {
              console.error(`❌ [REALTIME] Channel error on ${securityChannelName}:`, err);
              if (isMountedRef.current) {
                setError(`Lỗi kênh real-time: ${err?.message}`);
              }
            }
          });

        // Setup real-time subscription for system alerts
        const alertsChannelName = `system_alerts_${Date.now()}_${Math.random()}`;
        console.log(`🔗 [REALTIME] Creating system alerts channel: ${alertsChannelName}`);
        
        alertsChannel = supabase
          .channel(alertsChannelName)
          .on(
            'postgres_changes',
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'system_alerts' 
            },
            handleNewSystemAlert
          )
          .subscribe((status, err) => {
            console.log(`📡 [REALTIME] Alerts channel status: ${status}`);
            if (status === 'SUBSCRIBED') {
              console.log(`✅ [REALTIME] Successfully subscribed to ${alertsChannelName}`);
            }
            if (status === 'CHANNEL_ERROR') {
              console.error(`❌ [REALTIME] Channel error on ${alertsChannelName}:`, err);
              if (isMountedRef.current) {
                setError(`Lỗi kênh cảnh báo: ${err?.message}`);
              }
            }
          });

      } catch (err: any) {
        console.error('❌ [REALTIME] Error setting up real-time monitoring:', err);
        if (isMountedRef.current) {
          setError(`Lỗi tải dữ liệu: ${err.message}`);
          setIsSupabaseConnected(false);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    setupRealtime();

    return () => {
      console.log('🧹 [REALTIME] Cleaning up security monitoring channels...');
      isMountedRef.current = false;
      
      if (channel) {
        console.log('🧹 [REALTIME] Removing security events channel...');
        supabase.removeChannel(channel);
      }
      if (alertsChannel) {
        console.log('🧹 [REALTIME] Removing alerts channel...');
        supabase.removeChannel(alertsChannel);
      }
      
      console.log('✅ [REALTIME] Cleanup completed');
    };
  }, [user, handleNewSecurityEvent, handleNewSystemAlert]);

  useEffect(() => {
    const generateThreatTrends = () => {
      const today = new Date();
      const trends: ThreatTrend[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const dailyEvents = recentEvents.filter(event =>
          new Date(event.created_at!).toISOString().split('T')[0] === dateString
        );

        trends.push({
          date: dateString,
          successfulLogins: dailyEvents.filter(e => e.event_type === 'LOGIN_SUCCESS').length,
          failedLogins: dailyEvents.filter(e => e.event_type === 'LOGIN_FAILED').length,
          suspiciousActivities: dailyEvents.filter(e => 
            e.event_type === 'SUSPICIOUS_ACTIVITY' || e.event_type === 'RATE_LIMIT_EXCEEDED'
          ).length,
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
    isRefreshing,
    error,
    logEvent,
    refreshEvents,
    activeUsers,
    systemStatus,
    securityAlerts,
  };
};