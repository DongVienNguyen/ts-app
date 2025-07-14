import { useState, useEffect, useCallback } from 'react';
import { SystemHealth } from './types';
import { healthCheckService } from '@/services/healthCheckService';

const initialHealthState: SystemHealth = {
  database: { status: 'healthy', responseTime: 0, connections: 0, lastCheck: '', uptime: 0 },
  api: { status: 'healthy', responseTime: 0, uptime: 0, lastCheck: '', requestsPerMinute: 0 },
  storage: { status: 'healthy', used: 0, total: 100, percentage: 0, growth: 0, lastCheck: '' },
  memory: { status: 'healthy', used: 0, total: 100, percentage: 0, peak: 0, lastCheck: '' },
  performance: { averageResponseTime: 0, totalOperations: 0, slowestOperation: null, fastestOperation: null },
  security: { status: 'healthy', activeThreats: 0, lastSecurityScan: '', failedLogins: 0, lastCheck: '' },
  email: { status: 'healthy', lastCheck: '', responseTime: 0, uptime: 0 },
  pushNotification: { status: 'healthy', lastCheck: '', responseTime: 0, uptime: 0 },
  overall: 'healthy'
};

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>(initialHealthState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const healthSummary = await healthCheckService.getHealthSummary();
      setHealth(healthSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setHealth(initialHealthState);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return { health, isLoading, error, refresh: fetchHealth };
}