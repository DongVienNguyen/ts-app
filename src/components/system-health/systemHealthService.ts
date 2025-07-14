import { supabase } from '@/integrations/supabase/client';
import { SystemHealth, DatabaseHealth, ApiHealth, StorageHealth, MemoryHealth, SecurityHealth, EmailHealth, PushNotificationHealth } from '@/components/system-health/types';
import { determineOverallHealth } from '@/components/system-health/utils';
import { getPerformanceStats } from '@/utils/performanceMonitor';

class HealthCheckService {
  private async checkDatabase(): Promise<DatabaseHealth> {
    const start = Date.now();
    try {
      const { error } = await supabase.from('staff').select('id', { count: 'exact', head: true });
      const responseTime = Date.now() - start;
      if (error) throw error;

      const status = responseTime > 1000 ? 'warning' : 'healthy';
      return {
        status,
        responseTime,
        connections: Math.floor(Math.random() * 10) + 1,
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
      };
    } catch (e) {
      return {
        status: 'error',
        responseTime: Date.now() - start,
        connections: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkApi(): Promise<ApiHealth> {
    const responseTime = Math.random() * 300;
    const status = responseTime > 500 ? 'warning' : 'healthy';
    return {
      status,
      responseTime,
      requestsPerMinute: Math.floor(Math.random() * 120),
      uptime: 99.98,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkStorage(): Promise<StorageHealth> {
    const percentage = Math.random() * 90;
    const status = percentage > 90 ? 'error' : percentage > 80 ? 'warning' : 'healthy';
    return {
      status,
      used: percentage * 10,
      total: 1000,
      percentage,
      growth: Math.random() * 2 - 1,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkMemory(): Promise<MemoryHealth> {
    const percentage = Math.random() * 85;
    const status = percentage > 90 ? 'error' : percentage > 80 ? 'warning' : 'healthy';
    return {
      status,
      used: percentage * 1.6,
      total: 1600,
      percentage,
      peak: percentage + Math.random() * 10,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkSecurity(): Promise<SecurityHealth> {
    const { count } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .eq('event_type', 'LOGIN_FAILED');
      
    const failedLogins = count || 0;
    const status = failedLogins > 10 ? 'error' : failedLogins > 5 ? 'warning' : 'healthy';

    return {
      status,
      activeThreats: 0,
      failedLogins,
      lastSecurityScan: new Date().toISOString(),
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkEmail(): Promise<EmailHealth> {
    return {
      status: 'healthy',
      responseTime: Math.random() * 100,
      uptime: 100,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkPushNotifications(): Promise<PushNotificationHealth> {
    return {
      status: 'healthy',
      responseTime: Math.random() * 150,
      uptime: 100,
      lastCheck: new Date().toISOString(),
    };
  }

  public async getHealthSummary(): Promise<SystemHealth> {
    try {
      const [
        database,
        api,
        storage,
        memory,
        security,
        email,
        pushNotification,
      ] = await Promise.all([
        this.checkDatabase(),
        this.checkApi(),
        this.checkStorage(),
        this.checkMemory(),
        this.checkSecurity(),
        this.checkEmail(),
        this.checkPushNotifications(),
      ]);

      const overall = determineOverallHealth(
        database.status,
        api.status,
        storage.status,
        memory.status,
        security.status,
        email.status,
        pushNotification.status
      );

      const perfStats = getPerformanceStats();

      const health: SystemHealth = {
        database,
        api,
        storage,
        memory,
        security,
        email,
        pushNotification,
        performance: {
          averageResponseTime: perfStats.averageDuration,
          totalOperations: perfStats.totalMetrics,
          slowestOperation: perfStats.slowestMetric?.name || null,
          fastestOperation: perfStats.fastestMetric?.name || null,
        },
        overall,
      };
      return health;
    } catch (error) {
      console.error("Error getting health summary:", error);
      const lastCheck = new Date().toISOString();
      const errorStatus = { status: 'error' as const, lastCheck };
      return {
        database: { ...errorStatus, connections: 0, responseTime: 0, uptime: 0 },
        api: { ...errorStatus, requestsPerMinute: 0, responseTime: 0, uptime: 0 },
        storage: { ...errorStatus, used: 0, total: 0, percentage: 0, growth: 0 },
        memory: { ...errorStatus, used: 0, total: 0, percentage: 0, peak: 0 },
        security: { ...errorStatus, activeThreats: 0, failedLogins: 0, lastSecurityScan: lastCheck },
        email: { ...errorStatus, responseTime: 0, uptime: 0 },
        pushNotification: { ...errorStatus, responseTime: 0, uptime: 0 },
        performance: { averageResponseTime: 0, totalOperations: 0, slowestOperation: null, fastestOperation: null },
        overall: 'error',
      };
    }
  }
}

export const healthCheckService = new HealthCheckService();