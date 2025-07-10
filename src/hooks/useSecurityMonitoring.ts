import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSecurityLogs, SecurityEvent, logSecurityEvent } from '@/utils/secureAuthUtils';
import { logSecurityEventRealTime } from '@/utils/realTimeSecurityUtils';

interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  recentFailedLogins: number;
  securityEvents: SecurityEvent[];
  onlineUsers: number;
  suspiciousActivities: number;
  lastUpdated: Date;
}

interface RealTimeMetrics {
  loginAttempts: number;
  failedLogins: number;
  successfulLogins: number;
  accountLocks: number;
  passwordResets: number;
  suspiciousActivities: number;
}

interface AlertConfig {
  enabled: boolean;
  threshold: number;
  type: 'sound' | 'notification' | 'both';
}

export function useSecurityMonitoring() {
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    recentFailedLogins: 0,
    securityEvents: [],
    onlineUsers: 0,
    suspiciousActivities: 0,
    lastUpdated: new Date()
  });

  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    loginAttempts: 0,
    failedLogins: 0,
    successfulLogins: 0,
    accountLocks: 0,
    passwordResets: 0,
    suspiciousActivities: 0
  });

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    enabled: true,
    threshold: 5,
    type: 'both'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for alerts
  useEffect(() => {
    const createBeepSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.warn('Audio context not available:', error);
      }
    };

    audioRef.current = {
      play: () => Promise.resolve(createBeepSound())
    } as HTMLAudioElement;
  }, []);

  const loadSecurityStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: users, error: usersError } = await supabase
        .from('staff')
        .select('account_status, failed_login_attempts, last_failed_login');

      if (usersError) throw usersError;

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.account_status === 'active').length || 0;
      const lockedUsers = users?.filter(u => u.account_status === 'locked').length || 0;

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentFailedLogins = users?.filter(u => 
        u.last_failed_login && new Date(u.last_failed_login) > twentyFourHoursAgo
      ).length || 0;

      const securityEvents = getSecurityLogs().slice(0, 20);
      const onlineUsers = Math.floor(activeUsers * 0.3);
      const suspiciousActivities = securityEvents.filter(e => 
        e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED'
      ).length;

      setStats({
        totalUsers,
        activeUsers,
        lockedUsers,
        recentFailedLogins,
        securityEvents,
        onlineUsers,
        suspiciousActivities,
        lastUpdated: new Date()
      });

      if (alertConfig.enabled && recentFailedLogins >= alertConfig.threshold) {
        triggerAlert(`Cảnh báo: ${recentFailedLogins} lần đăng nhập thất bại trong 24h qua!`);
      }

    } catch (error) {
      console.error('Error loading security stats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [alertConfig]);

  const updateRealTimeMetrics = useCallback(() => {
    const recentEvents = getSecurityLogs().filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return eventTime > fiveMinutesAgo;
    });

    setRealTimeMetrics({
      loginAttempts: recentEvents.filter(e => e.type.includes('LOGIN')).length,
      failedLogins: recentEvents.filter(e => e.type === 'LOGIN_FAILED').length,
      successfulLogins: recentEvents.filter(e => e.type === 'LOGIN_SUCCESS').length,
      accountLocks: recentEvents.filter(e => e.type === 'ACCOUNT_LOCKED').length,
      passwordResets: recentEvents.filter(e => e.type.includes('PASSWORD_RESET')).length,
      suspiciousActivities: recentEvents.filter(e => 
        e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED'
      ).length
    });
  }, []);

  const triggerAlert = useCallback((message: string) => {
    if (alertConfig.type === 'sound' || alertConfig.type === 'both') {
      audioRef.current?.play().catch(console.error);
    }
    
    if (alertConfig.type === 'notification' || alertConfig.type === 'both') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Cảnh báo bảo mật', {
          body: message,
          icon: '/favicon.ico'
        });
      }
    }

    logSecurityEvent('SECURITY_ALERT_TRIGGERED', { message, threshold: alertConfig.threshold });
    logSecurityEventRealTime('SECURITY_ALERT_TRIGGERED', { message, threshold: alertConfig.threshold });
  }, [alertConfig]);

  const resetMetrics = useCallback(() => {
    setRealTimeMetrics({
      loginAttempts: 0,
      failedLogins: 0,
      successfulLogins: 0,
      accountLocks: 0,
      passwordResets: 0,
      suspiciousActivities: 0
    });
    logSecurityEvent('METRICS_RESET', { resetBy: 'admin' });
    logSecurityEventRealTime('METRICS_RESET', { resetBy: 'admin' });
  }, []);

  // Real-time data fetching
  useEffect(() => {
    if (isRealTimeEnabled && !isPaused) {
      loadSecurityStats();
      
      intervalRef.current = setInterval(() => {
        loadSecurityStats();
        updateRealTimeMetrics();
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRealTimeEnabled, isPaused, loadSecurityStats, updateRealTimeMetrics]);

  // Connection status
  useEffect(() => {
    setIsConnected(isRealTimeEnabled && !isPaused);
  }, [isRealTimeEnabled, isPaused]);

  return {
    stats,
    realTimeMetrics,
    isRealTimeEnabled,
    isConnected,
    isPaused,
    alertConfig,
    isLoading,
    error,
    setIsRealTimeEnabled,
    setIsPaused: () => setIsPaused(!isPaused),
    setAlertConfig,
    resetMetrics
  };
}