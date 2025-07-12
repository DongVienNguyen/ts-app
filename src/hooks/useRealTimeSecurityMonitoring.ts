import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, PostgrestResponse } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { AuthenticatedStaff } from '@/contexts/AuthContext';

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
  apiResponseTime: number; // in ms
  dbConnected: boolean;
  dbResponseTime: number; // in ms
}

export const useRealTimeSecurityMonitoring = (user: AuthenticatedStaff | null) => {
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

  const logEvent = async (type: string, data: any = {}, username?: string) => {
    // Bọc truy vấn Supabase trong một Promise tường minh
    const promise = new Promise<PostgrestResponse<Tables<'security_events'>[]>>(async (resolve, reject) => {
      try {
        const { data: resultData, error: resultError } = await supabase
          .from('security_events')
          .insert({ event_type: type, event_data: data, username: username })
          .select();

        if (resultError) {
          // Nếu Supabase trả về lỗi, reject Promise
          reject(resultError);
        } else {
          // Nếu thành công, resolve Promise với dữ liệu
          resolve({ data: resultData, error: null, status: 201, statusText: 'Created', count: null });
        }
      } catch (e) {
        // Bắt các lỗi không mong muốn khác (ví dụ: lỗi mạng)
        reject(e);
      }
    });

    toast.promise(promise, {
      loading: 'Đang ghi sự kiện bảo mật vào CSDL...',
      success: (response) => {
        // Callback này chỉ được gọi khi Promise được resolve (thành công)
        console.log('Sự kiện đã được ghi thành công:', response.data);
        return 'Ghi sự kiện vào CSDL thành công!';
      },
      error: (err) => {
        // Callback này được gọi khi Promise bị reject (thất bại)
        console.error('Lỗi ghi sự kiện bảo mật:', err);
        // Đảm bảo truy cập message một cách an toàn
        const errorMessage = (err instanceof Error) ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : 'Lỗi không xác định');
        return `Lỗi ghi sự kiện: ${errorMessage}`;
      },
    });
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setIsLoading(false);
      setIsSupabaseConnected(false);
      setRecentEvents([]);
      setSecurityAlerts([]);
      return;
    }

    const clientAtSubscriptionTime = supabase; // Capture the client instance at the time of subscription
    let channel: RealtimeChannel | null = null;
    let alertsChannel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: initialEvents, error: eventsError } = await clientAtSubscriptionTime
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (eventsError) throw eventsError;
        setRecentEvents(initialEvents || []);

        const { data: initialAlerts, error: alertsError } = await clientAtSubscriptionTime
          .from('system_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (alertsError) throw alertsError;
        setSecurityAlerts(initialAlerts || []);

        setSystemStatus({
          apiConnected: true,
          apiResponseTime: Math.floor(Math.random() * 100) + 20,
          dbConnected: true,
          dbResponseTime: Math.floor(Math.random() * 80) + 10,
        });
        setActiveUsers(Math.floor(Math.random() * 20) + 5);

        setIsSupabaseConnected(true);

        // Use unique channel names to prevent conflicts
        const securityChannelName = `security_events:${user.id}:${Date.now()}`;
        const alertsChannelName = `system_alerts:${user.id}:${Date.now()}`;

        channel = clientAtSubscriptionTime
          .channel(securityChannelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'security_events' },
            (payload) => {
              const newEvent = payload.new as SecurityEvent;
              console.log('✅ [REALTIME] Received new security event:', newEvent);
              setRecentEvents((prev) => [newEvent, ...prev].slice(0, 50));
              toast.info(`Sự kiện bảo mật mới: ${newEvent.event_type}`);
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(`✅ [REALTIME] Subscribed to ${securityChannelName}!`);
            }
            if (status === 'CHANNEL_ERROR') {
              console.error(`❌ [REALTIME] Channel error on ${securityChannelName}:`, err);
              setError(`Lỗi kênh real-time: ${err?.message}`);
            }
          });

        alertsChannel = clientAtSubscriptionTime
          .channel(alertsChannelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'system_alerts' },
            (payload) => {
              const newAlert = payload.new as SystemAlert;
              console.log('✅ [REALTIME] Received new system alert:', newAlert);
              setSecurityAlerts((prev) => [newAlert, ...prev].slice(0, 10));
              toast.warning(`Cảnh báo hệ thống mới: ${newAlert.rule_name}`);
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(`✅ [REALTIME] Subscribed to ${alertsChannelName}!`);
            }
            if (status === 'CHANNEL_ERROR') {
              console.error(`❌ [REALTIME] Channel error on ${alertsChannelName}:`, err);
              setError(`Lỗi kênh real-time: ${err?.message}`);
            }
          });

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
      console.log('🧹 [REALTIME] Cleaning up security monitoring channels...');
      const removePromises = [];
      if (channel) {
        removePromises.push(clientAtSubscriptionTime.removeChannel(channel));
      }
      if (alertsChannel) {
        removePromises.push(clientAtSubscriptionTime.removeChannel(alertsChannel));
      }
      
      if (removePromises.length > 0) {
        Promise.all(removePromises)
          .then(() => console.log('🧹 [REALTIME] Channels removed successfully.'))
          .catch(err => console.error('❌ [REALTIME] Error removing channels:', err));
      }
    };
  }, [user]);

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