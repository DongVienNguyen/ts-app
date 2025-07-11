import { systemDbOperation } from '@/utils/supabaseAuth';

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
  severity?: string;
  status?: string;
  error_data?: any;
  created_at?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SystemMetric {
  id?: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  additional_data?: any;
  created_at?: string;
}

export interface SystemStatus {
  id?: string;
  service_name: string;
  status: string;
  response_time_ms?: number;
  error_rate?: number;
  uptime_percentage?: number;
  status_data?: any;
  last_check?: string;
  created_at?: string;
}

// Global error handler
let globalErrorHandler: ((error: Error, context?: any) => void) | null = null;

// Performance measurement decorator
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      
      await logSystemMetric({
        metric_type: 'performance',
        metric_name: `${name}_duration`,
        metric_value: duration,
        metric_unit: 'ms'
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      await logSystemMetric({
        metric_type: 'performance',
        metric_name: `${name}_error_duration`,
        metric_value: duration,
        metric_unit: 'ms'
      });
      
      throw error;
    }
  }) as T;
}

// Log system error with proper error handling
export async function logSystemError(errorData: SystemError): Promise<void> {
  try {
    const result = await systemDbOperation(async (client) => {
      const { error } = await client
        .from('system_errors')
        .insert({
          ...errorData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    });

    if (result) {
      console.log('✅ System error logged successfully');
    } else {
      throw new Error('Failed to log system error');
    }
  } catch (error) {
    console.error('❌ Failed to log system error:', error);
    
    // Fallback to localStorage
    try {
      const existingErrors = JSON.parse(localStorage.getItem('system_errors') || '[]');
      existingErrors.push({
        ...errorData,
        timestamp: new Date().toISOString(),
        fallback: true
      });
      
      // Keep only last 100 errors
      if (existingErrors.length > 100) {
        existingErrors.splice(0, existingErrors.length - 100);
      }
      
      localStorage.setItem('system_errors', JSON.stringify(existingErrors));
      console.log('📝 Error logged to localStorage as fallback');
    } catch (storageError) {
      console.error('❌ Failed to log to localStorage:', storageError);
    }
  }
}

// Log system metric with proper error handling
export async function logSystemMetric(metricData: SystemMetric): Promise<void> {
  try {
    const result = await systemDbOperation(async (client) => {
      const { error } = await client
        .from('system_metrics')
        .insert({
          ...metricData,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    });

    if (!result) {
      console.warn('⚠️ Failed to log system metric');
    }
  } catch (error) {
    console.warn('⚠️ Failed to log system metric:', error);
    // Don't throw error for metrics - they're not critical
  }
}

// Update system status with proper error handling
export async function updateSystemStatus(statusData: SystemStatus): Promise<void> {
  try {
    const result = await systemDbOperation(async (client) => {
      const { error } = await client
        .from('system_status')
        .insert({
          ...statusData,
          last_check: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    });

    if (!result) {
      console.warn('⚠️ Failed to update system status');
    }
  } catch (error) {
    console.warn('⚠️ Failed to update system status:', error);
    // Don't throw error for status updates - they're not critical
  }
}

// Check service health
export async function checkServiceHealth(serviceName: string): Promise<SystemStatus> {
  const startTime = performance.now();
  
  try {
    // Simple health check based on service name
    let isHealthy = true;
    let responseTime = Math.round(performance.now() - startTime);
    
    switch (serviceName) {
      case 'database':
        const dbResult = await systemDbOperation(async (client) => {
          const { error } = await client.from('staff').select('count').limit(1);
          return !error;
        });
        isHealthy = !!dbResult;
        break;
      
      case 'email':
      case 'push_notification':
      case 'api':
        // For other services, assume they're healthy for now
        isHealthy = true;
        break;
    }
    
    responseTime = Math.round(performance.now() - startTime);
    
    return {
      service_name: serviceName,
      status: isHealthy ? 'online' : 'offline',
      response_time_ms: responseTime,
      uptime_percentage: isHealthy ? 100 : 0,
      status_data: {
        lastCheck: new Date().toISOString(),
        result: isHealthy ? 'success' : 'failed'
      }
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      service_name: serviceName,
      status: 'offline',
      response_time_ms: responseTime,
      uptime_percentage: 0,
      status_data: {
        lastCheck: new Date().toISOString(),
        result: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Monitor system resources
export async function monitorResources(): Promise<void> {
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
    }

    // Connection info
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

    // Page performance
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
    console.warn('⚠️ Error monitoring resources:', error);
  }
}

// Capture and log application errors
export async function captureError(
  error: Error,
  context?: {
    functionName?: string;
    userId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    additionalData?: any;
  }
): Promise<void> {
  const errorData: SystemError = {
    error_type: error.name || 'Error',
    error_message: error.message,
    error_stack: error.stack,
    function_name: context?.functionName,
    user_id: context?.userId,
    request_url: window.location.href,
    user_agent: navigator.userAgent,
    severity: context?.severity || 'medium',
    status: 'open',
    error_data: context?.additionalData
  };

  await logSystemError(errorData);

  // Also log performance metrics if it's a performance-related error
  if (error.message.includes('timeout') || error.message.includes('slow')) {
    await logSystemMetric({
      metric_type: 'error',
      metric_name: 'error_count',
      metric_value: 1,
      metric_unit: 'count',
      additional_data: {
        error_type: error.name,
        function_name: context?.functionName
      }
    });
  }

  // Call global error handler if set
  if (globalErrorHandler) {
    try {
      globalErrorHandler(error, context);
    } catch (handlerError) {
      console.error('❌ Global error handler failed:', handlerError);
    }
  }
}

// Setup global error handling
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    captureError(error, {
      functionName: 'unhandledrejection',
      severity: 'high',
      additionalData: { type: 'unhandled_promise_rejection' }
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('🚨 Uncaught error:', event.error);
    
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    captureError(error, {
      functionName: 'uncaught_error',
      severity: 'high',
      additionalData: {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  console.log('🛡️ Global error handling setup completed');
}

// Set global error handler
export function setGlobalErrorHandler(handler: (error: Error, context?: any) => void): void {
  globalErrorHandler = handler;
}

// Get error statistics
export async function getErrorStatistics(timeRange: 'day' | 'week' | 'month' = 'day') {
  try {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const result = await systemDbOperation(async (client) => {
      const { data, error } = await client
        .from('system_errors')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    });

    if (!result) {
      return {
        total: 0,
        byType: {},
        bySeverity: {},
        recent: []
      };
    }

    const byType: { [key: string]: number } = {};
    const bySeverity: { [key: string]: number } = {};

    result.forEach(error => {
      byType[error.error_type] = (byType[error.error_type] || 0) + 1;
      bySeverity[error.severity || 'medium'] = (bySeverity[error.severity || 'medium'] || 0) + 1;
    });

    return {
      total: result.length,
      byType,
      bySeverity,
      recent: result.slice(0, 10)
    };
  } catch (error) {
    console.error('❌ Failed to get error statistics:', error);
    return {
      total: 0,
      byType: {},
      bySeverity: {},
      recent: []
    };
  }
}