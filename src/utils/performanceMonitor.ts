interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start(name: string, metadata?: any): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.metrics.set(name, metric);
    console.log(`⏱️ Performance: Started timing "${name}"`);
  }

  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ Performance: No metric found for "${name}"`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration
    };

    this.completedMetrics.push(completedMetric);
    this.metrics.delete(name);

    console.log(`✅ Performance: "${name}" completed in ${duration.toFixed(2)}ms`);
    
    // Keep only last 100 metrics
    if (this.completedMetrics.length > 100) {
      this.completedMetrics = this.completedMetrics.slice(-100);
    }

    return duration;
  }

  getStats(): {
    totalMetrics: number;
    averageDuration: number;
    slowestMetric: PerformanceMetric | null;
    fastestMetric: PerformanceMetric | null;
    recentMetrics: PerformanceMetric[];
  } {
    const metrics = this.completedMetrics.filter(m => m.duration !== undefined);
    
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        slowestMetric: null,
        fastestMetric: null,
        recentMetrics: []
      };
    }

    const durations = metrics.map(m => m.duration!);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const slowestMetric = metrics.reduce((prev, current) => 
      (prev.duration! > current.duration!) ? prev : current
    );
    
    const fastestMetric = metrics.reduce((prev, current) => 
      (prev.duration! < current.duration!) ? prev : current
    );

    return {
      totalMetrics: metrics.length,
      averageDuration,
      slowestMetric,
      fastestMetric,
      recentMetrics: metrics.slice(-10)
    };
  }

  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
    console.log('🧹 Performance: All metrics cleared');
  }

  getMetricsByName(pattern: string): PerformanceMetric[] {
    return this.completedMetrics.filter(m => m.name.includes(pattern));
  }

  logSummary(): void {
    const stats = this.getStats();
    console.group('📊 Performance Summary');
    console.log(`Total Metrics: ${stats.totalMetrics}`);
    console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
    if (stats.slowestMetric) {
      console.log(`Slowest: ${stats.slowestMetric.name} (${stats.slowestMetric.duration!.toFixed(2)}ms)`);
    }
    if (stats.fastestMetric) {
      console.log(`Fastest: ${stats.fastestMetric.name} (${stats.fastestMetric.duration!.toFixed(2)}ms)`);
    }
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions for easy use
export const startTiming = (name: string, metadata?: any) => {
  performanceMonitor.start(name, metadata);
};

export const endTiming = (name: string) => {
  return performanceMonitor.end(name);
};

export const getPerformanceStats = () => {
  return performanceMonitor.getStats();
};

export const clearPerformanceMetrics = () => {
  performanceMonitor.clear();
};

// Decorator for timing functions
export function timed(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      startTiming(metricName);
      try {
        const result = await originalMethod.apply(this, args);
        endTiming(metricName);
        return result;
      } catch (error) {
        endTiming(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}