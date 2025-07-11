import { useState, useEffect } from 'react';
import { SystemHealth } from './types';
import { SystemHealthService } from './systemHealthService';

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

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
    checkSystemHealth();
    
    if (autoRefresh) {
      const interval = setInterval(checkSystemHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return {
    health,
    isLoading,
    lastUpdated,
    checkSystemHealth
  };
};