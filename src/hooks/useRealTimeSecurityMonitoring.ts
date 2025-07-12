import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToSecurityEvents,
  getRealTimeSecurityStats,
  logSecurityEventRealTime,
  RealTimeSecurityStats,
  SecurityEvent
} from '@/utils/realTimeSecurityUtils';

export function useRealTimeSecurityMonitoring() {
  const [stats, setStats] = useState<RealTimeSecurityStats>({
    activeConnections: 0,
    recentEvents: [],
    threatLevel: 'LOW',
    systemHealth: 'HEALTHY',
    loginAttempts: 0,
    failedLogins: 0,
    successfulLogins: 0,
    accountLocks: 0,
    passwordResets: 0,
    suspiciousActivities: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // Thay đổi từ string sang Date | null

  // Tải số liệu thống kê ban đầu
  const loadStats = useCallback(async () => {
    if (isPaused) return;
    try {
      setIsLoading(true);
      setError(null);
      const newStats = await getRealTimeSecurityStats();
      setStats(newStats);
      setIsConnected(true);
      setLastUpdated(new Date()); // Lưu trữ đối tượng Date
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPaused]);

  // Xử lý sự kiện thời gian thực
  const handleRealTimeEvent = useCallback((event: SecurityEvent) => {
    if (!isRealTimeEnabled || isPaused) return;
    setStats(prevStats => ({
      ...prevStats,
      recentEvents: [event, ...prevStats.recentEvents].slice(0, 50)
    }));
    setLastUpdated(new Date()); // Lưu trữ đối tượng Date
  }, [isRealTimeEnabled, isPaused]);

  // Đăng ký sự kiện thời gian thực
  useEffect(() => {
    loadStats();

    let unsubscribe: () => void;
    if (isRealTimeEnabled) {
      unsubscribe = subscribeToSecurityEvents(handleRealTimeEvent);
    }

    // Làm mới số liệu thống kê định kỳ (chỉ khi không tạm dừng)
    const interval = setInterval(() => {
      if (!isPaused) {
        loadStats();
      }
    }, 30000);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(interval);
    };
  }, [loadStats, handleRealTimeEvent, isRealTimeEnabled, isPaused]);

  // Hàm bật/tắt thời gian thực
  const handleRealTimeToggle = useCallback(() => {
    setIsRealTimeEnabled(prev => !prev);
    setIsPaused(false);
  }, []);

  // Hàm bật/tắt tạm dừng
  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Hàm đặt lại
  const handleReset = useCallback(() => {
    setStats({
      activeConnections: 0,
      recentEvents: [],
      threatLevel: 'LOW',
      systemHealth: 'HEALTHY',
      loginAttempts: 0,
      failedLogins: 0,
      successfulLogins: 0,
      accountLocks: 0,
      passwordResets: 0,
      suspiciousActivities: 0
    });
    setIsConnected(false);
    setIsLoading(true);
    setError(null);
    setIsRealTimeEnabled(true);
    setIsPaused(false);
    setLastUpdated(null); // Đặt lại thành null
    loadStats();
  }, [loadStats]);

  return {
    events: stats.recentEvents,
    metrics: stats,
    lastUpdated,
    isConnected,
    isRealTimeEnabled,
    isPaused,
    isLoading,
    error,
    handleRealTimeToggle,
    handlePauseToggle,
    handleReset,
    logEvent: logSecurityEventRealTime,
    refreshStats: loadStats
  };
}