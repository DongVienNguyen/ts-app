import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

interface PageLoadMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initializeObservers();
    this.trackPageLoad();
  }

  // Track custom timing
  time(name: string, tags?: Record<string, string>): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        type: 'timing',
        tags
      });
      
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`, tags);
    };
  }

  // Track counters
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'counter',
      tags
    });
  }

  // Track gauges
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'gauge',
      tags
    });
  }

  // Get page load metrics
  getPageLoadMetrics(): PageLoadMetrics | null {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return null;

    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
      largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
      cumulativeLayoutShift: this.getMetricValue('cumulative-layout-shift'),
      firstInputDelay: this.getMetricValue('first-input-delay')
    };
  }

  // Get resource loading metrics
  getResourceMetrics() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const metrics = {
      totalResources: resources.length,
      totalSize: 0,
      totalLoadTime: 0,
      slowestResource: { name: '', duration: 0 },
      resourceTypes: {} as Record<string, number>
    };

    resources.forEach(resource => {
      const duration = resource.responseEnd - resource.requestStart;
      metrics.totalLoadTime += duration;
      
      if (resource.transferSize) {
        metrics.totalSize += resource.transferSize;
      }

      if (duration > metrics.slowestResource.duration) {
        metrics.slowestResource = {
          name: resource.name,
          duration
        };
      }

      // Count by type
      const type = this.getResourceType(resource.name);
      metrics.resourceTypes[type] = (metrics.resourceTypes[type] || 0) + 1;
    });

    return metrics;
  }

  // Get memory usage
  getMemoryMetrics() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // Get all metrics
  getAllMetrics() {
    return {
      pageLoad: this.getPageLoadMetrics(),
      resources: this.getResourceMetrics(),
      memory: this.getMemoryMetrics(),
      custom: this.metrics.slice(-50), // Last 50 custom metrics
      timestamp: Date.now()
    };
  }

  // Get performance stats for compatibility
  getStats() {
    const timingMetrics = this.metrics.filter(m => m.type === 'timing');
    
    if (timingMetrics.length === 0) {
      return {
        totalMetrics: this.metrics.length,
        averageDuration: 0,
        slowestMetric: null,
        fastestMetric: null
      };
    }

    const averageDuration = timingMetrics.reduce((sum, m) => sum + m.value, 0) / timingMetrics.length;
    
    const slowestMetric = timingMetrics.reduce((slowest, current) => 
      current.value > slowest.value ? current : slowest
    );
    
    const fastestMetric = timingMetrics.reduce((fastest, current) => 
      current.value < fastest.value ? current : fastest
    );

    return {
      totalMetrics: this.metrics.length,
      averageDuration,
      slowestMetric,
      fastestMetric
    };
  }

  // Export metrics for analysis
  exportMetrics() {
    const allMetrics = this.getAllMetrics();
    const blob = new Blob([JSON.stringify(allMetrics, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
    console.log('🧹 Performance metrics cleared');
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📊 Performance monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private initializeObservers(): void {
    // Observe paint metrics
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: entry.name,
              value: entry.startTime,
              timestamp: Date.now(),
              type: 'timing'
            });
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe layout shifts
        const layoutObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.hadRecentInput) return;
            
            this.recordMetric({
              name: 'cumulative-layout-shift',
              value: entry.value,
              timestamp: Date.now(),
              type: 'gauge'
            });
          });
        });
        layoutObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutObserver);

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.recordMetric({
            name: 'largest-contentful-paint',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            type: 'timing'
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

      } catch (error) {
        console.warn('⚠️ Some performance observers not supported:', error);
      }
    }
  }

  private trackPageLoad(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = this.getPageLoadMetrics();
        if (metrics) {
          console.log('📊 Page Load Metrics:', metrics);
          
          // Track slow page loads
          if (metrics.loadTime > 3000) {
            this.increment('slow-page-load', 1, {
              loadTime: metrics.loadTime.toString()
            });
          }
        }
      }, 0);
    });
  }

  private getMetricValue(name: string): number {
    const metric = this.metrics.find(m => m.name === name);
    return metric ? metric.value : 0;
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Create global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export const trackComponentRender = (componentName: string) => {
  return performanceMonitor.time(`component-render:${componentName}`, {
    component: componentName
  });
};

export const trackApiCall = (endpoint: string) => {
  return performanceMonitor.time(`api-call:${endpoint}`, {
    endpoint
  });
};

export const trackUserAction = (action: string, details?: Record<string, string>) => {
  performanceMonitor.increment(`user-action:${action}`, 1, details);
};

// Legacy exports for compatibility
export const startTiming = (name: string) => {
  return performanceMonitor.time(name);
};

export const endTiming = (name: string) => {
  // This is handled by the returned function from startTiming
  console.log(`⏱️ ${name} completed`);
};

export const getPerformanceStats = () => {
  return performanceMonitor.getStats();
};

// React hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const endTracking = trackComponentRender(componentName);
  
  React.useEffect(() => {
    return endTracking;
  }, [endTracking]);
};

// Auto-track page navigation
if (typeof window !== 'undefined') {
  let currentPath = window.location.pathname;
  
  const trackNavigation = () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      performanceMonitor.increment('page-navigation', 1, {
        from: currentPath,
        to: newPath
      });
      currentPath = newPath;
    }
  };

  // Track navigation
  window.addEventListener('popstate', trackNavigation);
  
  // Track programmatic navigation
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    trackNavigation();
  };
}