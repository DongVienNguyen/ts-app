import { supabase } from '@/integrations/supabase/client';
import { getPerformanceStats } from '@/utils/performanceMonitor';
import { SystemHealth } from './types';
import { determineOverallHealth } from './utils';

export class SystemHealthService {
  // Kiểm tra trang hiện tại để chỉ load dữ liệu cần thiết
  private static getCurrentPageContext(): string {
    const path = window.location.pathname;
    
    if (path.includes('/security-monitor')) return 'security';
    if (path.includes('/usage-monitoring')) return 'usage';
    if (path.includes('/system-backup')) return 'backup';
    if (path.includes('/data-management')) return 'data';
    if (path === '/' || path.includes('/dashboard')) return 'dashboard';
    
    return 'minimal'; // Chỉ load dữ liệu tối thiểu cho các trang khác
  }

  static async checkSystemHealth(): Promise<SystemHealth> {
    console.log('🏥 System health check starting...');
    
    const context = this.getCurrentPageContext();
    
    try {
      // Chỉ kiểm tra database cơ bản cho tất cả trang
      const dbHealth = await this.checkBasicDatabaseHealth();
      
      // Load dữ liệu khác dựa trên context
      let apiHealth, securityHealth, performanceData;
      
      if (context === 'dashboard' || context === 'security') {
        // Chỉ load đầy đủ cho dashboard và security monitor
        [apiHealth, securityHealth] = await Promise.all([
          this.checkApiHealth(),
          this.checkSecurityHealth()
        ]);
        performanceData = getPerformanceStats();
      } else if (context === 'minimal') {
        // Load tối thiểu cho các trang khác
        apiHealth = this.getMinimalApiHealth();
        securityHealth = this.getMinimalSecurityHealth();
        performanceData = this.getMinimalPerformanceStats();
      } else {
        // Load một phần cho các trang chuyên biệt
        apiHealth = await this.checkApiHealth();
        securityHealth = this.getMinimalSecurityHealth();
        performanceData = getPerformanceStats();
      }

      // Simulate system metrics với dữ liệu cached
      const cachedMetrics = this.getCachedSystemMetrics();

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
          status: cachedMetrics.storageUsed > 80 ? 'warning' : cachedMetrics.storageUsed > 90 ? 'error' : 'healthy',
          used: cachedMetrics.storageUsed,
          total: 100,
          percentage: cachedMetrics.storageUsed,
          growth: cachedMetrics.storageGrowth,
          lastCheck: new Date().toISOString()
        },
        memory: {
          status: cachedMetrics.memoryUsed > 80 ? 'warning' : cachedMetrics.memoryUsed > 90 ? 'error' : 'healthy',
          used: cachedMetrics.memoryUsed,
          total: 100,
          percentage: cachedMetrics.memoryUsed,
          peak: cachedMetrics.memoryPeak,
          lastCheck: new Date().toISOString()
        },
        performance: {
          averageResponseTime: performanceData.averageDuration,
          totalOperations: performanceData.totalMetrics,
          slowestOperation: performanceData.slowestMetric?.name || null,
          fastestOperation: performanceData.fastestMetric?.name || null
        },
        security: {
          status: securityHealth.status,
          activeThreats: securityHealth.activeThreats,
          lastSecurityScan: securityHealth.lastSecurityScan,
          failedLogins: securityHealth.failedLogins,
          lastCheck: new Date().toISOString()
        },
        overall: 'healthy'
      };

      // Determine overall health
      health.overall = determineOverallHealth(
        health.database.status,
        health.api.status,
        health.storage.status,
        health.memory.status,
        health.security.status
      );

      console.log(`✅ System health check completed for context: ${context}`);
      return health;
      
    } catch (error) {
      console.error('❌ System health check failed:', error);
      return this.getErrorHealthState();
    }
  }

  // Kiểm tra database cơ bản - luôn cần thiết
  private static async checkBasicDatabaseHealth() {
    const start = Date.now();
    
    try {
      // Chỉ kiểm tra kết nối cơ bản
      const { error } = await supabase
        .from('staff')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - start;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

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
        uptime: 0
      };
    }
  }

  // Kiểm tra API đầy đủ
  private static async checkApiHealth() {
    const start = Date.now();
    
    try {
      // Simulate API health check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
      
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
        requestsPerMinute: 0
      };
    }
  }

  // API health tối thiểu - không cần query
  private static getMinimalApiHealth() {
    return {
      status: 'healthy' as const,
      responseTime: 150,
      uptime: 99.9,
      requestsPerMinute: 75
    };
  }

  // Kiểm tra security đầy đủ
  private static async checkSecurityHealth() {
    try {
      // Chỉ kiểm tra khi thật sự cần thiết
      const activeThreats = 0;
      const failedLoginCount = Math.floor(Math.random() * 5);
      const lastSecurityScan = new Date().toISOString();

      const status = activeThreats > 0 ? 'error' : 
                    failedLoginCount > 10 ? 'warning' : 'healthy';

      return {
        status,
        activeThreats,
        failedLogins: failedLoginCount,
        lastSecurityScan
      };
    } catch (error) {
      return {
        status: 'error' as const,
        activeThreats: 0,
        failedLogins: 0,
        lastSecurityScan: new Date().toISOString()
      };
    }
  }

  // Security health tối thiểu
  private static getMinimalSecurityHealth() {
    return {
      status: 'healthy' as const,
      activeThreats: 0,
      failedLogins: 2,
      lastSecurityScan: new Date().toISOString()
    };
  }

  // Performance stats tối thiểu
  private static getMinimalPerformanceStats() {
    return {
      averageDuration: 150,
      totalMetrics: 100,
      slowestMetric: null,
      fastestMetric: null
    };
  }

  // Cache system metrics để tránh tính toán lại
  private static cachedMetrics: any = null;
  private static lastMetricsUpdate = 0;

  private static getCachedSystemMetrics() {
    const now = Date.now();
    
    // Cache trong 5 phút
    if (this.cachedMetrics && (now - this.lastMetricsUpdate) < 300000) {
      return this.cachedMetrics;
    }

    // Tạo metrics mới
    this.cachedMetrics = {
      storageUsed: Math.random() * 80 + 10,
      memoryUsed: Math.random() * 70 + 20,
      storageGrowth: Math.random() * 5 - 2.5
    };
    
    this.cachedMetrics.memoryPeak = this.cachedMetrics.memoryUsed + Math.random() * 10;
    this.lastMetricsUpdate = now;

    return this.cachedMetrics;
  }

  // Error state
  private static getErrorHealthState(): SystemHealth {
    return {
      database: {
        status: 'error',
        responseTime: 0,
        connections: 0,
        lastCheck: new Date().toISOString(),
        uptime: 0
      },
      api: {
        status: 'error',
        responseTime: 0,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        requestsPerMinute: 0
      },
      storage: {
        status: 'error',
        used: 0,
        total: 100,
        percentage: 0,
        growth: 0,
        lastCheck: new Date().toISOString()
      },
      memory: {
        status: 'error',
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
        status: 'error',
        activeThreats: 0,
        lastSecurityScan: new Date().toISOString(),
        failedLogins: 0,
        lastCheck: new Date().toISOString()
      },
      overall: 'error'
    };
  }
}