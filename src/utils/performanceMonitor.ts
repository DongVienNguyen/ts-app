interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 50; // Giảm từ 100 xuống 50
  private isEnabled = false;
  private lastCleanup = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Chỉ enable khi thật sự cần thiết
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Chỉ track khi enabled
  startMeasure(name: string): () => void {
    if (!this.isEnabled) {
      return () => {}; // No-op function
    }

    const startTime = performance.now();
    
    return () => {
      if (!this.isEnabled) return;
      
      const duration = performance.now() - startTime;
      this.addMetric(name, duration);
    };
  }

  private addMetric(name: string, duration: number) {
    if (!this.isEnabled) return;

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    });

    // Giữ chỉ maxMetrics metrics gần nhất
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Cleanup cũ mỗi 5 phút
    const now = Date.now();
    if (now - this.lastCleanup > 300000) {
      this.cleanup();
      this.lastCleanup = now;
    }
  }

  private cleanup() {
    const fiveMinutesAgo = Date.now() - 300000;
    this.metrics = this.metrics.filter(metric => metric.timestamp > fiveMinutesAgo);
  }

  getStats() {
    if (!this.isEnabled || this.metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestMetric: null,
        fastestMetric: null
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;

    const slowestMetric = this.metrics.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );

    const fastestMetric = this.metrics.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );

    return {
      totalMetrics: this.metrics.length,
      averageDuration,
      slowestMetric,
      fastestMetric
    };
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
  }
}

const performanceMonitor = PerformanceMonitor.getInstance();

// Chỉ enable khi ở trang cần thiết
const shouldEnableMonitoring = () => {
  const path = window.location.pathname;
  return path === '/' || 
         path.includes('/dashboard') || 
         path.includes('/security-monitor') ||
         path.includes('/usage-monitoring');
};

// Auto enable/disable based on page
if (shouldEnableMonitoring()) {
  performanceMonitor.enable();
} else {
  performanceMonitor.disable();
}

// Export functions
export const startPerformanceMeasure = (name: string) => {
  return performanceMonitor.startMeasure(name);
};

export const getPerformanceStats = () => {
  return performanceMonitor.getStats();
};

export const clearPerformanceMetrics = () => {
  performanceMonitor.clear();
};

export const enablePerformanceMonitoring = () =><think>Deciding which files are relevant...

[
  "src/components/system-health/performance/types.ts",
  "src/components/system-health/performance/PerformanceScoreCard.tsx",
  "src/components/system-health/performance/PerformanceCharts.tsx",
  "src/components/system-health/performance/ResourceUsageCharts.tsx",
  "src/components/system-health/performance/UserActivityChart.tsx",
  "src/components/system-health/performance/PerformanceAnalysis.tsx",
  "src/components/system-health/performance/PerformanceHeader.tsx",
  "src/components/system-health/performance/performanceDataService.ts",
  "src/components/system-health/performance/usePerformanceAnalytics.ts",
  "src/components/system-health/performance/index.ts",
  "src/components/system-health/PerformanceAnalytics.tsx",
  "src/components/system-health/index.ts",
  "src/services/systemHealthAlertService.ts",
  "src/components/system-health/SystemHealthDashboard.tsx",
  "src/pages/Index.tsx",
  "public/sw.js",
  "index.html",
  "src/utils/pushNotificationUtils.ts",
  "src/components/system-health/useSystemHealth.ts",
  "src/components/system-health/systemHealthService.ts",
  "src/hooks/useAutoNotificationSetup.ts",
  "src/utils/performanceMonitor.ts"
]</think><dyad-codebase-context files="src/components/system-health/performance/types.ts,src/components/system-health/performance/PerformanceScoreCard.tsx,src/components/system-health/performance/PerformanceCharts.tsx,src/components/system-health/performance/ResourceUsageCharts.tsx,src/components/system-health/performance/UserActivityChart.tsx,src/components/system-health/performance/PerformanceAnalysis.tsx,src/components/system-health/performance/PerformanceHeader.tsx,src/components/system-health/performance/performanceDataService.ts,src/components/system-health/performance/usePerformanceAnalytics.ts,src/components/system-health/performance/index.ts,src/components/system-health/PerformanceAnalytics.tsx,src/components/system-health/index.ts,src/services/systemHealthAlertService.ts,src/components/system-health/SystemHealthDashboard.tsx,src/pages/Index.tsx,public/sw.js,index.html,src/utils/pushNotificationUtils.ts,src/components/system-health/useSystemHealth.ts,src/components/system-health/systemHealthService.ts,src/hooks/useAutoNotificationSetup.ts,src/utils/performanceMonitor.ts"></dyad-codebase-context>  {
  performanceMonitor.enable();
};

export const disablePerformanceMonitoring = () => {
  performanceMonitor.disable();
};

// Lightweight decorator for critical functions only
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const endMeasure = startPerformanceMeasure(metricName);
      try {
        const result = await originalMethod.apply(this, args);
        endMeasure();
        return result;
      } catch (error) {
        endMeasure();
        throw error;
      }
    };

    return descriptor;
  };
}