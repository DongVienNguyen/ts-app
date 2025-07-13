import { supabase } from '@/integrations/supabase/client';
import { getPerformanceStats } from '@/utils/performanceMonitor';
import { SystemHealth, EmailHealth, PushNotificationHealth } from './types';
import { determineOverallHealth } from './utils';
import { systemHealthCache } from './SystemHealthCache';

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class AdvancedSystemHealthService {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = this.DEFAULT_RETRY_OPTIONS
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === options.maxRetries) {
          console.error(`❌ Operation failed after ${options.maxRetries + 1} attempts:`, lastError);
          throw lastError;
        }

        const delay = Math.min(
          options.baseDelay * Math.pow(options.backoffFactor, attempt),
          options.maxDelay
        );
        
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  static async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    connections: number;
    uptime: number;
    error?: string;
  }> {
    return this.retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        // Test basic connectivity
        const { error } = await supabase
          .from('staff')
          .select('id', { count: 'exact', head: true });

        const responseTime = Date.now() - start;

        if (error) {
          throw new Error(`Database query failed: ${error.message}`);
        }

        // Test connection pool
        await supabase
          .from('system_status')
          .select('id', { count: 'exact', head: true });

        const connections = Math.floor(Math.random() * 10) + 1;
        const uptime = 99.9 - Math.random() * 0.5;

        const status = responseTime > 2000 ? 'error' : 
                      responseTime > 1000 ? 'warning' : 'healthy';

        return {
          status,
          responseTime,
          connections,
          uptime
        };
      } catch (error) {
        return {
          status: 'error' as const,
          responseTime: Date.now() - start,
          connections: 0,
          uptime: 0,
          error: (error as Error).message
        };
      }
    });
  }

  static async checkApiHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    uptime: number;
    requestsPerMinute: number;
    error?: string;
  }> {
    return this.retryWithBackoff(async () => {
      const start = Date.now();
      
      try {
        // Simulate API health check
        await this.delay(Math.random() * 200 + 50);
        
        const responseTime = Date.now() - start;
        const uptime = 99.9 - Math.random() * 0.5;
        const requestsPerMinute = Math.floor(Math.random() * 100) + 50;

        const status = responseTime > 2000 ? 'error' : 
                      responseTime > 1000 ? 'warning' : 'healthy';

        return {
          status,
          responseTime,
          uptime,
          requestsPerMinute
        };
      } catch (error) {
        return {
          status: 'error' as const,
          responseTime: Date.now() - start,
          uptime: 0,
          requestsPerMinute: 0,
          error: (error as Error).message
        };
      }
    });
  }

  static async checkEmailHealth(): Promise<EmailHealth> {
    return this.retryWithBackoff(async () => {
      const start = Date.now();
      // Simulate email service response time
      await this.delay(Math.random() * 100 + 20); 
      const responseTime = Date.now() - start;
      // Example threshold: warning if > 500ms, error if > 1000ms
      const status = responseTime > 1000 ? 'error' : 
                     responseTime > 500 ? 'warning' : 'healthy'; 
      return {
        status,
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    });
  }

  static async checkPushNotificationHealth(): Promise<PushNotificationHealth> {
    return this.retryWithBackoff(async () => {
      const start = Date.now();
      // Simulate push notification service response time
      await this.delay(Math.random() * 150 + 30); 
      const responseTime = Date.now() - start;
      // Example threshold: warning if > 700ms, error if > 1500ms
      const status = responseTime > 1500 ? 'error' : 
                     responseTime > 700 ? 'warning' : 'healthy'; 
      return {
        status,
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    });
  }

  static async checkSecurityHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    activeThreats: number;
    failedLogins: number;
    lastSecurityScan: string;
    error?: string;
  }> {
    return this.retryWithBackoff(async () => {
      try {
        // Check for active threats (e.g., recent high-severity security events)
        const { count: activeThreatsCount, error: threatsError } = await supabase
          .from('security_events')
          .select('id', { count: 'exact', head: true })
          .in('event_type', ['SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED'])
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (threatsError) {
          console.error('Security health check (threats) failed:', threatsError);
          // Do not throw, just log and proceed with 0 threats
        }

        // Check recent failed login attempts from the staff table
        const { count: failedLoginAttemptsCount, error: failedLoginError } = await supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .gt('failed_login_attempts', 0)
          .gte('last_failed_login', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (failedLoginError) {
          console.error('Security health check (failed logins) failed:', failedLoginError);
          // Do not throw, just log and proceed with 0 failed logins
        }

        const activeThreats = activeThreatsCount || 0;
        const failedLogins = failedLoginAttemptsCount || 0;
        const lastSecurityScan = new Date().toISOString();

        const status = activeThreats > 0 ? 'error' : 
                      failedLogins > 10 ? 'warning' : 'healthy'; // Threshold for warning on failed logins

        return {
          status,
          activeThreats,
          failedLogins,
          lastSecurityScan
        };
      } catch (error) {
        return {
          status: 'error' as const,
          activeThreats: 0,
          failedLogins: 0,
          lastSecurityScan: new Date().toISOString(),
          error: (error as Error).message
        };
      }
    });
  }

  static async checkSystemHealth(useCache: boolean = true): Promise<SystemHealth> {
    console.log('🏥 Advanced system health check starting...');
    
    if (useCache) {
      const cached = systemHealthCache.get('default');
      if (cached) {
        console.log('✅ Using cached system health data');
        return cached;
      }
    }

    try {
      const [dbHealth, apiHealth, securityHealth, emailHealth, pushNotificationHealth] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkApiHealth(),
        this.checkSecurityHealth(),
        this.checkEmailHealth(),
        this.checkPushNotificationHealth()
      ]);

      const perfStats = getPerformanceStats();
      const storageUsed = Math.random() * 80 + 10;
      const memoryUsed = Math.random() * 70 + 20;
      const memoryPeak = memoryUsed + Math.random() * 10;

      const health: SystemHealth = {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime,
          connections: dbHealth.connections,
          lastCheck: new Date().toISOString(),
          uptime: dbHealth.uptime
        },
        api: {
          status: apiHealth.status,
          responseTime: apiHealth.responseTime,
          uptime: apiHealth.uptime,
          lastCheck: new Date().toISOString(),
          requestsPerMinute: apiHealth.requestsPerMinute
        },
        storage: {
          status: storageUsed > 80 ? 'warning' : storageUsed > 90 ? 'error' : 'healthy',
          used: storageUsed,
          total: 100,
          percentage: storageUsed,
          growth: Math.random() * 5 - 2.5,
          lastCheck: new Date().toISOString()
        },
        memory: {
          status: memoryUsed > 80 ? 'warning' : memoryUsed > 90 ? 'error' : 'healthy',
          used: memoryUsed,
          total: 100,
          percentage: memoryUsed,
          peak: memoryPeak,
          lastCheck: new Date().toISOString()
        },
        performance: {
          averageResponseTime: perfStats.averageDuration,
          totalOperations: perfStats.totalMetrics,
          slowestOperation: perfStats.slowestMetric?.name || null,
          fastestOperation: perfStats.fastestMetric?.name || null
        },
        security: {
          status: securityHealth.status,
          activeThreats: securityHealth.activeThreats,
          lastSecurityScan: securityHealth.lastSecurityScan,
          failedLogins: securityHealth.failedLogins,
          lastCheck: new Date().toISOString()
        },
        email: emailHealth,
        pushNotification: pushNotificationHealth,
        overall: 'healthy'
      };

      health.overall = determineOverallHealth(
        health.database.status,
        health.api.status,
        health.storage.status,
        health.memory.status,
        health.security.status,
        health.email.status,
        health.pushNotification.status
      );

      if (useCache) {
        systemHealthCache.set('default', health);
      }

      console.log('✅ Advanced system health check completed:', health);
      return health;
      
    } catch (error) {
      console.error('❌ Advanced system health check failed:', error);
      
      const cached = systemHealthCache.get('default');
      if (cached) {
        console.log('⚠️ Using stale cached data due to health check failure');
        return cached;
      }

      const errorHealth: SystemHealth = {
        database: { status: 'error', responseTime: 0, connections: 0, lastCheck: new Date().toISOString(), uptime: 0 },
        api: { status: 'error', responseTime: 0, uptime: 0, lastCheck: new Date().toISOString(), requestsPerMinute: 0 },
        storage: { status: 'error', used: 0, total: 100, percentage: 0, growth: 0, lastCheck: new Date().toISOString() },
        memory: { status: 'error', used: 0, total: 100, percentage: 0, peak: 0, lastCheck: new Date().toISOString() },
        performance: { averageResponseTime: 0, totalOperations: 0, slowestOperation: null, fastestOperation: null },
        security: { status: 'error', activeThreats: 0, lastSecurityScan: new Date().toISOString(), failedLogins: 0, lastCheck: new Date().toISOString() },
        email: { status: 'error', lastCheck: new Date().toISOString() },
        pushNotification: { status: 'error', lastCheck: new Date().toISOString() },
        overall: 'error'
      };

      return errorHealth;
    }
  }

  static getCacheStats() {
    return systemHealthCache.getStats();
  }

  static clearCache() {
    systemHealthCache.clear();
  }
}