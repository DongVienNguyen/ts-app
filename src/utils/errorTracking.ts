import { supabase } from '@/integrations/supabase/client';

export interface SystemError {
  id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  function_name?: string;
  user_id?: string;
  request_url?: string;
  user_agent?: string;
  ip_address?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  error_data?: any;
  created_at?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SystemMetric {
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  additional_data?: any;
}

export interface SystemStatus {
  service_name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  response_time_ms?: number;
  error_rate?: number;
  uptime_percentage?: number;
  status_data?: any;
}

// Log system error
export async function logSystemError(error: Omit<SystemError, 'id' | 'created_at'>) {
  try {
    const { data, error: dbError } = await supabase
      .from('system_errors')
      .insert({
        ...error,
        user_agent: error.user_agent || navigator.userAgent,
        request_url: error.request_url || window.location.href,
        ip_address: error.ip_address || await getClientIP()
      })
      .select()
      .single();

    if (dbError) throw dbError;
    
    console.log('✅ System error logged:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to log system error:', error);
    // Fallback to localStorage if database fails
    const localErrors = JSON.parse(localStorage.getItem('system_errors') || '[]');
    localErrors.unshift({ ...error, created_at: new Date().toISOString() });
    localStorage.setItem('system_errors', JSON.stringify(localErrors.slice(0, 100)));
  }
}

// Log system metric
export async function logSystemMetric(metric: SystemMetric) {
  try {
    const { data, error } = await supabase
      .from('system_metrics')
      .insert(metric)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Failed to log system metric:', error);
  }
}

// Update system status
export async function updateSystemStatus(status: SystemStatus) {
  try {
    const { data, error } = await supabase
      .from('system_status')
      .insert(status)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Failed to update system status:', error);
  }
}

// Get client IP
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return null;
  }
}

// Error boundary helper
export function captureError(error: Error, context?: any) {
  const errorInfo: Omit<SystemError, 'id' | 'created_at'> = {
    error_type: error.name || 'UnknownError',
    error_message: error.message,
    error_stack: error.stack,
    function_name: context?.functionName,
    user_id: context?.userId,
    severity: context?.severity || 'medium',
    status: 'open',
    error_data: context
  };

  logSystemError(errorInfo);
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => Promise<any>) {
  return async (...args: any[]) => {
    const startTime = performance.now();
    let error: Error | null = null;
    
    try {
      const result = await fn.apply(this, args);
      return result;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance metric
      logSystemMetric({
        metric_type: 'performance',
        metric_name: name,
        metric_value: duration,
        metric_unit: 'ms',
        additional_data: {
          success: !error,
          error: error?.message
        }
      });
    }
  };
}

// Resource monitoring
export async function monitorResources() {
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
    }

    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      await logSystemMetric({
        metric_type: 'network',
        metric_name: 'effective_type',
        metric_value: connection.effectiveType === '4g' ? 4 : 
                     connection.effectiveType === '3g' ? 3 : 
                     connection.effectiveType === '2g' ? 2 : 1,
        metric_unit: 'generation'
      });
    }

    // Page load time
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
    console.error('❌ Failed to monitor resources:', error);
  }
}

// Service health check
export async function checkServiceHealth(serviceName: string, checkUrl?: string): Promise<SystemStatus> {
  const startTime = performance.now();
  let status: SystemStatus['status'] = 'online';
  let responseTime = 0;
  let errorRate = 0;

  try {
    if (checkUrl) {
      const response = await fetch(checkUrl, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      responseTime = performance.now() - startTime;
      
      if (!response.ok) {
        status = 'degraded';
        errorRate = 1;
      }
    } else {
      // For services without URL, check based on recent errors
      const { data: recentErrors } = await supabase
        .from('system_errors')
        .select('*')
        .eq('function_name', serviceName)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (recentErrors && recentErrors.length > 5) {
        status = 'degraded';
        errorRate = recentErrors.length / 10; // Normalize to 0-1
      }
    }
  } catch (error) {
    status = 'offline';
    errorRate = 1;
    responseTime = performance.now() - startTime;
  }

  const statusData: SystemStatus = {
    service_name: serviceName,
    status,
    response_time_ms: Math.round(responseTime),
    error_rate: errorRate,
    uptime_percentage: status === 'online' ? 100 : status === 'degraded' ? 75 : 0
  };

  await updateSystemStatus(statusData);
  return statusData;
}

// Global error handler
export function setupGlobalErrorHandling() {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureError(new Error(event.reason), {
      severity: 'high',
      functionName: 'unhandledrejection'
    });
  });

  // JavaScript errors
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      severity: 'high',
      functionName: event.filename,
      error_data: {
        line: event.lineno,
        column: event.colno
      }
    });
  });

  // Resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      logSystemError({
        error_type: 'ResourceError',
        error_message: `Failed to load resource: ${(event.target as any)?.src || 'unknown'}`,
        severity: 'medium',
        status: 'open',
        function_name: 'resource_loading'
      });
    }
  }, true);
}