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
    systemHealth: 'HEALTHY'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial stats
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newStats = await getRealTimeSecurityStats();
      setStats(newStats);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle real-time events
  const handleRealTimeEvent = useCallback((event: SecurityEvent) => {
    setStats(prevStats => ({
      ...prevStats,
      recentEvents: [event, ...prevStats.recentEvents].slice(0, 50)
    }));
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    loadStats();

    const unsubscribe = subscribeToSecurityEvents(handleRealTimeEvent);

    // Refresh stats periodically
    const interval = setInterval(loadStats, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadStats, handleRealTimeEvent]);

  // Log security event
  const logEvent = useCallback(async (eventType: string, data?: any, username?: string) => {
    await logSecurityEventRealTime(eventType, data, username);
  }, []);

  return {
    stats,
    isConnected,
    isLoading,
    error,
    logEvent,
    refreshStats: loadStats
  };
}