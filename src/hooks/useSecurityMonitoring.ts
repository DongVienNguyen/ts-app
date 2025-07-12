import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SecurityEvent } from '@/utils/realTimeSecurityUtils';

export interface SecurityStats {
  totalEvents: number;
  loginAttempts: number;
  failedLogins: number;
  suspiciousActivity: number;
  recentEvents: SecurityEvent[];
}

async function getSecurityStats(): Promise<SecurityStats> {
  // Lấy sự kiện trong 7 ngày qua
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events, error, count } = await supabase
    .from('security_events')
    .select('*', { count: 'exact' })
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Không thể tải dữ liệu giám sát: ' + error.message);
  }

  const allEvents = events || [];

  const loginAttempts = allEvents.filter(e => e.event_type === 'LOGIN_SUCCESS' || e.event_type === 'LOGIN_FAILED').length;
  const failedLogins = allEvents.filter(e => e.event_type === 'LOGIN_FAILED').length;
  const suspiciousActivity = allEvents.filter(e => e.event_type === 'SUSPICIOUS_ACTIVITY' || e.event_type === 'RATE_LIMIT_EXCEEDED').length;

  const recentEvents: SecurityEvent[] = allEvents.slice(0, 10).map(event => ({
    id: event.id,
    type: event.event_type,
    timestamp: event.created_at,
    data: event.event_data,
    userAgent: event.user_agent,
    ip: event.ip_address,
    username: event.username
  }));

  return {
    totalEvents: count ?? 0,
    loginAttempts,
    failedLogins,
    suspiciousActivity,
    recentEvents,
  };
}

export function useSecurityMonitoring() {
  const { data, isLoading, error } = useQuery<SecurityStats>({
    queryKey: ['securityStats'],
    queryFn: getSecurityStats,
  });

  const getEventTrends = () => {
    if (!data?.recentEvents) return [];
    
    const trends: { date: string; successfulLogins: number; failedLogins: number; suspiciousActivities: number }[] = [];
    const dailyData: { [date: string]: { successfulLogins: number; failedLogins: number; suspiciousActivities: number } } = {};

    // Use all events from the fetched data for a better trend analysis
    const eventsForTrend = data?.recentEvents || [];

    eventsForTrend.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-CA');
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

    Object.keys(dailyData).sort().forEach(date => {
      trends.push({ date, ...dailyData[date] });
    });

    return trends;
  };

  const defaultStats: SecurityStats = {
    totalEvents: 0,
    loginAttempts: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    recentEvents: [],
  };

  return {
    stats: data || defaultStats,
    isLoading,
    error: error ? (error as Error).message : null,
    getEventTrends,
  };
}