import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToSecurityEvents,
  getRealTimeSecurityStats,
  logSecurityEventRealTime, // Đảm bảo import đúng tên
  RealTimeSecurityStats,
  SecurityEvent
} from '@/utils/realTimeSecurityUtils';

export function useRealTimeSecurityMonitoring() {
  const [stats, setStats] = useState<RealTimeSecurityStats>({
    activeConnections: 0,
    recentEvents: [],
    threatLevel: 'LOW',
    systemHealth: 'HEALTHY',
    loginAttempts: 0, // Khởi tạo các giá trị mới
    failedLogins: 0,
    successfulLogins: 0,
    accountLocks: 0,
    passwordResets: 0,
    suspiciousActivities: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true); // Trạng thái mới
  const [isPaused, setIsPaused] = useState(false); // Trạng thái mới
  const [lastUpdated, setLastUpdated] = useState<string>(''); // Trạng thái mới

  // Tải số liệu thống kê ban đầu
  const loadStats = useCallback(async () => {
    if (isPaused) return; // Không tải nếu đang tạm dừng
    try {
      setIsLoading(true);
      setError(null);
      const newStats = await getRealTimeSecurityStats();
      setStats(newStats);
      setIsConnected(true);
      setLastUpdated(new Date().toLocaleString('vi-VN')); // Cập nhật thời gian cập nhật cuối cùng
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [isPaused]); // Phụ thuộc vào isPaused

  // Xử lý sự kiện thời gian thực
  const handleRealTimeEvent = useCallback((event: SecurityEvent) => {
    if (!isRealTimeEnabled || isPaused) return; // Không xử lý nếu thời gian thực bị tắt hoặc tạm dừng
    setStats(prevStats => ({
      ...prevStats,
      recentEvents: [event, ...prevStats.recentEvents].slice(0, 50)
    }));
    setLastUpdated(new Date().toLocaleString('vi-VN')); // Cập nhật thời gian cập nhật cuối cùng khi có sự kiện mới
  }, [isRealTimeEnabled, isPaused]); // Phụ thuộc vào isRealTimeEnabled và isPaused

  // Đăng ký sự kiện thời gian thực
  useEffect(() => {
    loadStats(); // Tải ban đầu

    let unsubscribe: () => void;
    if (isRealTimeEnabled) { // Chỉ đăng ký nếu thời gian thực được bật
      unsubscribe = subscribeToSecurityEvents(handleRealTimeEvent);
    }

    // Làm mới số liệu thống kê định kỳ (chỉ khi không tạm dừng)
    const interval = setInterval(() => {
      if (!isPaused) {
        loadStats();
      }
    }, 30000); // Mỗi 30 giây

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(interval);
    };
  }, [loadStats, handleRealTimeEvent, isRealTimeEnabled, isPaused]); // Thêm các phụ thuộc mới

  // Hàm bật/tắt thời gian thực
  const handleRealTimeToggle = useCallback(() => {
    setIsRealTimeEnabled(prev => !prev);
    setIsPaused(false); // Bỏ tạm dừng nếu thời gian thực được bật/tắt
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
    setLastUpdated('');
    loadStats(); // Tải lại số liệu thống kê ban đầu
  }, [loadStats]);

  return {
    events: stats.recentEvents, // Ánh xạ từ stats
    metrics: stats, // Truyền toàn bộ đối tượng stats làm metrics
    lastUpdated,
    isConnected,
    isRealTimeEnabled,
    isPaused,
    isLoading,
    error,
    handleRealTimeToggle,
    handlePauseToggle,
    handleReset,
    // Giữ lại logSecurityEventRealTime và refreshStats cho các mục đích sử dụng tiềm năng khác
    logEvent: logSecurityEventRealTime, // Sửa lỗi chính tả ở đây
    refreshStats: loadStats
  };
}