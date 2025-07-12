import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityEvent } from '@/utils/realTimeSecurityUtils'; // Tái sử dụng SecurityEvent interface

interface SecurityStats {
  totalEvents: number;
  loginAttempts: number;
  failedLogins: number;
  suspiciousActivity: number;
  recentEvents: SecurityEvent[];
}

export function useSecurityMonitoring() {
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    loginAttempts: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    recentEvents: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Lấy tất cả sự kiện trong 30 ngày gần nhất để tính toán tổng hợp
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: events, error: fetchError } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const processedEvents: SecurityEvent[] = events?.map(event => ({
        id: event.id,
        type: event.event_type,
        timestamp: event.created_at,
        data: event.event_data,
        userAgent: event.user_agent,
        ip: event.ip_address,
        username: event.username
      })) || [];

      const totalEvents = processedEvents.length;
      const loginAttempts = processedEvents.filter(e => e.type === 'LOGIN_ATTEMPT').length;
      const failedLogins = processedEvents.filter(e => e.type === 'LOGIN_FAILED').length;
      const suspiciousActivity = processedEvents.filter(e => 
        e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED'
      ).length;

      // Lấy 5 sự kiện gần đây nhất cho hiển thị
      const recentEvents = processedEvents.slice(0, 5);

      setStats({
        totalEvents,
        loginAttempts,
        failedLogins,
        suspiciousActivity,
        recentEvents
      });
    } catch (err) {
      console.error('Error fetching security stats:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải số liệu bảo mật.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityStats();
    // Có thể thêm interval để làm mới định kỳ nếu cần, nhưng cho tổng hợp thì không quá cần thiết
  }, [fetchSecurityStats]);

  return { stats, isLoading, error };
}