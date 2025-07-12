import { safeDbOperation } from '@/utils/supabaseAuth';
import { updateSystemStatus, logSystemMetric } from '@/utils/errorTracking';
import { supabase } from '@/integrations/supabase/client';

export class HealthCheckService {
  private static instance: HealthCheckService;
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  startMonitoring(intervalMinutes: number = 15) {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🏥 Starting health monitoring...');

    setTimeout(() => {
      this.runHealthChecks();
    }, 10000);

    this.checkInterval = setInterval(() => {
      this.runHealthChecks();
    }, intervalMinutes * 60 * 1000);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('🏥 Health monitoring stopped');
  }

  private async runHealthChecks() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('⚠️ Aborting health checks: not authenticated.');
      return;
    }

    console.log('🔍 Running health checks...');
    
    try {
      await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.collectBasicMetrics()
      ]);
      console.log('✅ Health checks completed');
    } catch (error) {
      console.error('❌ Error during health checks:', error);
    }
  }

  private async checkDatabaseHealth() {
    const startTime = performance.now();
    
    try {
      const result = await safeDbOperation(async (client) => {
        const { data, error } = await client
          .from('staff')
          .select('count')
          .limit(1);

        if (error) throw error;
        return data;
      });

      const responseTime = Math.round(performance.now() - startTime);

      if (result !== null) {
        await updateSystemStatus({
          service_name: 'database',
          status: 'online',
          response_time_ms: responseTime,
          uptime_percentage: 100,
          status_data: {
            lastCheck: new Date().toISOString(),
            responseTime,
            result: 'success'
          }
        });

        await logSystemMetric({
          metric_type: 'performance',
          metric_name: 'database_response_time',
          metric_value: responseTime,
          metric_unit: 'ms'
        });
      } else {
        throw new Error('Database query returned null');
      }

    } catch (error) {
      console.warn('⚠️ Database health check failed:', error);
    }
  }

  private async collectBasicMetrics() {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        await logSystemMetric({
          metric_type: 'memory',
          metric_name: 'used_heap_size',
          metric_value: memory.usedJSHeapSize,
          metric_unit: 'bytes'
        });
      }

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection?.effectiveType) {
          const effectiveTypeValue = 
            connection.effectiveType === '4g' ? 4 : 
            connection.effectiveType === '3g' ? 3 : 
            connection.effectiveType === '2g' ? 2 : 1;
          await logSystemMetric({
            metric_type: 'network',
            metric_name: 'effective_type',
            metric_value: effectiveTypeValue,
            metric_unit: 'generation'
          });
        }
      }

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        await logSystemMetric({
          metric_type: 'performance',
          metric_name: 'page_load_time',
          metric_value: navigation.loadEventEnd - navigation.fetchStart,
          metric_unit: 'ms'
        });
      }

    } catch (error) {
      console.warn('⚠️ Error collecting basic metrics:', error);
    }
  }

  async getHealthSummary() {
    try {
      const statuses = await safeDbOperation(async (client) => {
        const { data, error } = await client
          .from('system_status')
          .select('*')
          .in('service_name', ['database'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        return data;
      });

      if (!statuses) {
        return {
          overallHealth: 0,
          services: {},
          summary: { total: 0, online: 0, degraded: 0, offline: 0 }
        };
      }

      const latestStatuses: { [key: string]: any } = {};
      statuses.forEach(status => {
        if (!latestStatuses[status.service_name]) {
          latestStatuses[status.service_name] = status;
        }
      });

      const services = Object.values(latestStatuses);
      const onlineServices = services.filter(s => s.status === 'online').length;
      const totalServices = services.length;
      const overallHealth = totalServices > 0 ? (onlineServices / totalServices) * 100 : 0;

      return {
        overallHealth,
        services: latestStatuses,
        summary: {
          total: totalServices,
          online: onlineServices,
          degraded: services.filter(s => s.status === 'degraded').length,
          offline: services.filter(s => s.status === 'offline').length
        }
      };
    } catch (error) {
      console.error('❌ Error getting health summary:', error);
      return {
        overallHealth: 0,
        services: {},
        summary: { total: 0, online: 0, degraded: 0, offline: 0 }
      };
    }
  }

  onUserLogin() {
    console.log('🔐 User logged in, starting health monitoring...');
    setTimeout(() => {
      this.startMonitoring();
    }, 5000);
  }

  onUserLogout() {
    console.log('🔓 User logged out, stopping health monitoring...');
    this.stopMonitoring();
  }
}

export const healthCheckService = HealthCheckService.getInstance();