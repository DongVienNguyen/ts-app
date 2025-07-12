import { useState, useEffect, useRef } from 'react';
import { SystemHealth } from '../components/system-health/types';
import { SystemHealthService } from '../components/system-health/systemHealthService';

export const useSystemHealth = (autoRefresh: boolean = true) => {
  const [health, setHealth] = useState<SystemHealth>({
    database: {
      status: 'healthy',
      responseTime: 0,
      connections: 0,
      lastCheck: new Date().toISOString(),
      uptime: 99.9
    },
    api: {
      status: 'healthy',
      responseTime: 0,
      uptime: 99.9,
      lastCheck: new Date().toISOString(),
      requestsPerMinute: 0
    },
    storage: {
      status: 'healthy',
      used: 0,
      total: 100,
      percentage: 0,
      growth: 0,
      lastCheck: new Date().toISOString()
    },
    memory: {
      status: 'healthy',
      used: 0,
      total: 100,
      percentage: 0,
      peak: 0,
      lastCheck: new Date().toISOString()
    },
    performance: {
      averageResponseTime: 0,
      totalOperations: 0,
      slowestOperation: null,
      fastestOperation: null
    },
    security: {
      status: 'healthy',
      activeThreats: 0,
      lastSecurityScan: new Date().toISOString(),
      failedLogins: 0,
      lastCheck: new Date().toISOString()
    },
    overall: 'healthy'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialCheck = useRef(false);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    
    try {
      const newHealth = await SystemHealthService.checkSystemHealth();
      setHealth(newHealth);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Failed to check system health:', error);
      setHealth(prev => ({
        ...prev,
        overall: 'error',
        database: { ...prev.database, status: 'error' }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ kiểm tra 1 lần khi component mount
    if (!hasInitialCheck.current) {
      hasInitialCheck.current = true;
      checkSystemHealth();
    }
    
    if (autoRefresh) {
      // Giảm tần suất kiểm tra xuống 60 phút (3600000ms)
      intervalRef.current = setInterval(checkSystemHealth, 3600000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    health,
    isLoading,
    lastUpdated,
    checkSystemHealth
  };
};