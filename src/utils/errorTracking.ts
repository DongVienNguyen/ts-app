import { safeDbOperation } from '@/utils/supabaseAuth';

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
  resolution_notes?: string; // New field
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

export interface SystemAlert {
  id?: string;
  alert_id: string; // Unique identifier for the alert type (e.g., 'critical_error_alert')
  rule_id?: string; // ID of the rule that triggered the alert
  rule_name?: string; // Name of the rule
  metric?: string; // Metric that triggered the alert (e.g., 'error_count', 'database_response_time')
  current_value?: number; // Current value of the metric
  threshold?: number; // Threshold that was exceeded
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged?: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at?: string;
  updated_at?: string;
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
    const result = await safeDbOperation(async (client) => {
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
    const result = await safeDbOperation(async (client) => {
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
    const result = await safeDbOperation(async (client) => {
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

// Log system alert with proper error handling
export async function createSystemAlert(alertData: Omit<SystemAlert, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  try {
    const result = await safeDbOperation(async (client) => {
      const { error } = await client
        .from('system_alerts')
        .insert({
          ...alertData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    });

    if (result) {
      console.log('🔔 System alert created successfully');
    } else {
      throw new Error('Failed to create system alert');
    }
  } catch (error) {
    console.error('❌ Failed to create system alert:', error);
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
    status: 'new', // Default to 'new' status
    error_data: context?.additionalData
  };

  await logSystemError(errorData);

  // If the error is critical, create a system alert
  if (errorData.severity === 'critical') {
    await createSystemAlert({
      alert_id: 'critical_application_error',
      rule_name: 'Critical Application Error Detected',
      severity: 'critical',
      message: `Lỗi nghiêm trọng: ${errorData.error_message} tại ${errorData.function_name || 'unknown function'}.`,
      metric: 'error_count',
      current_value: 1, // Assuming one critical error
      threshold: 0, // Any critical error triggers an alert
      acknowledged: false,
    });
  }

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

    const result = await safeDbOperation(async (client) => {
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

export const getStatusColor = (status: string) => {
  if (status === 'online') return 'text-green-600 bg-green-100';
  if (status === 'degraded') return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export const getSeverityColor = (severity: string | undefined) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};