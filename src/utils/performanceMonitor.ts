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
  private timings: Map<string, number> = new Map();

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

  // Start timing function
  startTiming(name: string) {
    if (!this.isEnabled) return;
    this.timings.set(name, performance.now());
  }

  // End timing function
  endTiming(name: string) {
    if (!this.isEnabled) return;
    
    const startTime = this.timings.get(name);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.addMetric(name, duration);
      this.timings.delete(name);
    }
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
    this.timings.clear();
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

export const enablePerformanceMonitoring = () => {
  performanceMonitor.enable();
};

export const disablePerformanceMonitoring = () => {
  performanceMonitor.disable();
};

// Export timing functions
export const startTiming = (name: string) => {
  performanceMonitor.startTiming(name);
};

export const endTiming = (name: string) => {
  performanceMonitor.endTiming(name);
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