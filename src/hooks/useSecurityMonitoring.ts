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
  const [allProcessedEvents, setAllProcessedEvents] = useState<SecurityEvent[]>([]); // Lưu trữ tất cả sự kiện đã xử lý

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

      setAllProcessedEvents(processedEvents); // Lưu trữ để sử dụng cho biểu đồ

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

  // Hàm để xử lý dữ liệu sự kiện thành định dạng xu hướng cho biểu đồ
  const getEventTrends = useCallback(() => {
    const trends: { date: string; successfulLogins: number; failedLogins: number; suspiciousActivities: number }[] = [];
    const dailyData: { [date: string]: { successfulLogins: number; failedLogins: number; suspiciousActivities: number } } = {};

    allProcessedEvents.forEach(event => {
      // Sử dụng toLocaleDateString với 'en-CA' để đảm bảo định dạng YYYY-MM-DD nhất quán
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

    // Sắp xếp theo ngày và chuyển đổi thành mảng
    Object.keys(dailyData).sort().forEach(date => {
      trends.push({ date, ...dailyData[date] });
    });

    return trends;
  }, [allProcessedEvents]);

  useEffect(() => {
    fetchSecurityStats();
  }, [fetchSecurityStats]);

  return { stats, isLoading, error, getEventTrends };
}