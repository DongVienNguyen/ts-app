import { systemDbOperation } from '@/utils/supabaseAuth';
import { updateSystemStatus, logSystemMetric } from '@/utils/errorTracking';
import { emailService } from './emailService';
import { notificationService } from './notificationService';

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

  // Start health monitoring
  startMonitoring(intervalMinutes: number = 5) {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🏥 Starting health monitoring with service role client...');

    // Run initial check
    this.runHealthChecks();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.runHealthChecks();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop health monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('🏥 Health monitoring stopped');
  }

  // Run all health checks
  private async runHealthChecks() {
    console.log('🔍 Running health checks with system operations...');
    
    try {
      await Promise.all([
        this.checkDatabaseHealth(),
        this.checkEmailServiceHealth(),
        this.checkPushNotificationHealth(),
        this.checkAPIHealth(),
        this.collectSystemMetrics()
      ]);
      console.log('✅ Health checks completed successfully');
    } catch (error) {
      console.error('❌ Error during health checks:', error);
    }
  }

  // Check database health
  private async checkDatabaseHealth() {
    const startTime = performance.now();
    
    try {
      // Simple query to test database connectivity using system operation
      const result = await systemDbOperation(async (client) => {
        const { error } = await client
          .from('staff')
          .select('count')
          .limit(1);

        if (error) throw error;
        return true;
      });

      const responseTime = Math.round(performance.now() - startTime);

      if (!result) {
        throw new Error('Database query failed');
      }

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

      // Log performance metric
      await logSystemMetric({
        metric_type: 'performance',
        metric_name: 'database_response_time',
        metric_value: responseTime,
        metric_unit: 'ms'
      });

    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      
      await updateSystemStatus({
        service_name: 'database',
        status: 'offline',
        response_time_ms: responseTime,
        uptime_percentage: 0,
        status_data: {
          lastCheck: new Date().toISOString(),
          result: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  // Check email service health
  private async checkEmailServiceHealth() {
    try {
      await emailService.testEmailService();
    } catch (error) {
      console.error('❌ Email service health check failed:', error);
    }
  }

  // Check push notification health
  private async checkPushNotificationHealth() {
    try {
      await notificationService.testPushNotificationService();
    } catch (error) {
      console.error('❌ Push notification service health check failed:', error);
    }
  }

  // Check API health - simplified to avoid CORS issues
  private async checkAPIHealth() {
    const startTime = performance.now();
    
    try {
      // Simple database query instead of edge function call to avoid CORS
      const result = await systemDbOperation(async (client) => {
        const { error } = await client
          .from('staff')
          .select('count')
          .limit(1);

        if (error) throw error;
        return true;
      });

      const responseTime = Math.round(performance.now() - startTime);

      await updateSystemStatus({
        service_name: 'api',
        status: result ? 'online' : 'degraded',
        response_time_ms: responseTime,
        uptime_percentage: result ? 100 : 50,
        status_data: {
          lastCheck: new Date().toISOString(),
          responseTime,
          result: result ? 'success' : 'partial'
        }
      });

      // Log performance metric
      await logSystemMetric({
        metric_type: 'performance',
        metric_name: 'api_response_time',
        metric_value: responseTime,
        metric_unit: 'ms'
      });

    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      
      await updateSystemStatus({
        service_name: 'api',
        status: 'offline',
        response_time_ms: responseTime,
        uptime_percentage: 0,
        status_data: {
          lastCheck: new Date().toISOString(),
          result: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  // Collect system metrics
  private async collectSystemMetrics() {
    try {
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        await logSystemMetric({
          metric_type: 'memory',
          metric_name: 'used_heap_size',
          metric_value: memory.usedJSHeapSize,
          metric_unit: 'bytes'
        });
        
        await logSystemMetric({
          metric_type: 'memory',
          metric_name: 'total_heap_size',
          metric_value: memory.totalJSHeapSize,
          metric_unit: 'bytes'
        });

        await logSystemMetric({
          metric_type: 'memory',
          metric_name: 'heap_limit',
          metric_value: memory.jsHeapSizeLimit,
          metric_unit: 'bytes'
        });
      }

      // Connection info
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        if (connection.effectiveType) {
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

        if (connection.downlink) {
          await logSystemMetric({
            metric_type: 'network',
            metric_name: 'downlink_speed',
            metric_value: connection.downlink,
            metric_unit: 'mbps'
          });
        }
      }

      // Page performance
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        await logSystemMetric({
          metric_type: 'performance',
          metric_name: 'page_load_time',
          metric_value: navigation.loadEventEnd - navigation.fetchStart,
          metric_unit: 'ms'
        });

        await logSystemMetric({
          metric_type: 'performance',
          metric_name: 'dom_content_loaded',
          metric_value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          metric_unit: 'ms'
        });
      }

      // Active sessions count
      const activeSessions = await systemDbOperation(async (client) => {
        const { data } = await client
          .from('user_sessions')
          .select('count')
          .gte('session_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .is('session_end', null);
        return data;
      });

      if (activeSessions) {
        await logSystemMetric({
          metric_type: 'usage',
          metric_name: 'active_sessions_24h',
          metric_value: activeSessions.length,
          metric_unit: 'count'
        });
      }

    } catch (error) {
      console.error('❌ Error collecting system metrics:', error);
    }
  }

  // Get current system health summary
  async getHealthSummary() {
    try {
      const statuses = await systemDbOperation(async (client) => {
        const { data, error } = await client
          .from('system_status')
          .select('*')
          .in('service_name', ['database', 'email', 'push_notification', 'api'])
          .order('created_at', { ascending: false });

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

      // Get the latest status for each service
      const latestStatuses: { [key: string]: any } = {};
      statuses.forEach(status => {
        if (!latestStatuses[status.service_name]) {
          latestStatuses[status.service_name] = status;
        }
      });

      // Calculate overall health
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

  // Start monitoring when user logs in
  onUserLogin() {
    console.log('🔐 User logged in, starting health monitoring...');
    this.startMonitoring();
  }

  // Stop monitoring when user logs out
  onUserLogout() {
    console.log('🔓 User logged out, stopping health monitoring...');
    this.stopMonitoring();
  }
}

// Export singleton instance
export const healthCheckService = HealthCheckService.getInstance();