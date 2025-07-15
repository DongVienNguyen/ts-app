import { logSystemMetric } from '@/services/systemLogService';

export function measurePerformance<T extends (...args: any[]) => Promise<any>>(name: string, fn: T): T {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      await logSystemMetric({ metric_type: 'performance', metric_name: `${name}_duration`, metric_value: duration, metric_unit: 'ms' });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      await logSystemMetric({ metric_type: 'performance', metric_name: `${name}_error_duration`, metric_value: duration, metric_unit: 'ms' });
      throw error;
    }
  }) as T;
}

export async function monitorResources(): Promise<void> {
  try {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      await logSystemMetric({ metric_type: 'memory', metric_name: 'used_heap_size', metric_value: memory.usedJSHeapSize, metric_unit: 'bytes' });
    }

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection?.effectiveType) {
        const valueMap: Record<string, number> = { '4g': 4, '3g': 3, '2g': 2, 'slow-2g': 1 };
        const value = valueMap[connection.effectiveType] || 1;
        await logSystemMetric({ metric_type: 'network', metric_name: 'effective_type', metric_value: value, metric_unit: 'generation' });
      }
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      await logSystemMetric({ metric_type: 'performance', metric_name: 'page_load_time', metric_value: navigation.loadEventEnd - navigation.fetchStart, metric_unit: 'ms' });
    }
  } catch (error) {
    console.warn('⚠️ Error monitoring resources:', error);
  }
}