import { safeDbOperation } from '@/utils/supabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import { emailService } from '@/services/emailService';

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
  resolution_notes?: string;
  assigned_to?: string; // Added for error assignment
  isNew?: boolean; // Added for real-time highlighting
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
  isNew?: boolean; // Added for real-time highlighting
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
    errorType?: string; // Thêm thuộc tính này
  }
): Promise<void> {
  const errorData: SystemError = {
    error_type: context?.errorType || error.name || 'Error', // Sử dụng errorType từ context nếu có
    error_message: error.message,
    error_stack: error.stack,
    function_name: context?.functionName,
    user_id: context?.userId,
    request_url: window.location.href,
    user_agent: navigator.userAgent,
    severity: context?.severity || 'medium',
    status: 'open', // Default to 'open' status
    error_data: context?.additionalData
  };

  await logSystemError(errorData);

  // --- START: New Notification Logic ---
  try {
    const { data: admins, error: adminError } = await supabase
      .from('staff')
      .select('username, email')
      .eq('role', 'admin')
      .not('email', 'is', null);

    if (adminError) {
      console.error('Failed to fetch admins for notification:', adminError);
      return;
    }

    if (!admins || admins.length === 0) {
      console.warn('No admins found to send notifications to.');
      return;
    }

    // Create in-app notifications for admins
    const inAppNotificationPayload = {
      title: `Lỗi Hệ thống: ${errorData.severity?.toUpperCase()}`,
      message: errorData.error_message.substring(0, 250),
      notification_type: 'system_error',
      related_data: {
        error_type: errorData.error_type,
        function_name: errorData.function_name,
        message: errorData.error_message,
      },
    };

    const notificationPromises = admins.map(admin =>
      supabase.from('notifications').insert({
        ...inAppNotificationPayload,
        recipient_username: admin.username,
      })
    );
    
    try {
      await Promise.all(notificationPromises);
      console.log(`✅ In-app notifications created for ${admins.length} admins.`);
    } catch (dbError) {
      console.error('❌ Failed to create in-app notifications:', dbError);
    }

    const pushPayload = {
      title: `Lỗi Hệ thống: ${errorData.severity?.toUpperCase()}`,
      body: errorData.error_message.substring(0, 100),
      data: { url: '/error-monitoring' },
    };

    const emailSubject = `[Cảnh báo] Lỗi Hệ thống Mức độ ${errorData.severity?.toUpperCase()}`;
    const emailHtml = `
      <h1>Cảnh báo Lỗi Hệ thống</h1>
      <p>Một lỗi mới đã được ghi nhận với thông tin chi tiết như sau:</p>
      <ul>
        <li><strong>Mức độ:</strong> ${errorData.severity}</li>
        <li><strong>Loại lỗi:</strong> ${errorData.error_type}</li>
        <li><strong>Thông báo:</strong> ${errorData.error_message}</li>
        <li><strong>Hàm:</strong> ${errorData.function_name || 'N/A'}</li>
        <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
      </ul>
      <p>Vui lòng truy cập trang Giám sát Hệ thống để xem chi tiết và xử lý.</p>
    `;

    const severity = errorData.severity;

    if (severity === 'critical' || severity === 'high') {
      console.log(`Sending email and push notifications to ${admins.length} admins for ${severity} error.`);
      // Send emails
      const emails = admins.map(admin => admin.email!).filter(Boolean);
      if (emails.length > 0) {
        await emailService.sendBulkEmails(emails.map(email => ({ to: email, subject: emailSubject, html: emailHtml })));
      }
      // Send push notifications
      for (const admin of admins) {
        await notificationService.sendPushNotification(admin.username, pushPayload);
      }
    } else if (severity === 'medium') {
      console.log(`Sending push notifications to ${admins.length} admins for ${severity} error.`);
      // Send push notifications only
      for (const admin of admins) {
        await notificationService.sendPushNotification(admin.username, pushPayload);
      }
    }
  } catch (notificationError) {
    console.error('❌ Failed to send error notifications:', notificationError);
  }
  // --- END: New Notification Logic ---

  // If the error is critical, create a system alert
  if (errorData.severity === 'critical') {
    await createSystemAlert({
      alert_id: crypto.randomUUID(), // Generate a unique ID for each alert instance
      rule_name: 'Critical Application Error Detected',
      severity: 'critical',
      message: `Lỗi nghiêm trọng: ${errorData.error_message} tại ${errorData.function_name || 'unknown function'}.`,
      metric: 'error_count',
      current_value: 1, // Assuming one critical error
      threshold: 0, // Any critical error triggers an alert
      acknowledged: false,
      rule_id: 'critical_application_error', // Thêm rule_id để khắc phục lỗi not-null constraint
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

// Calculate error statistics from a given array of errors
export function getErrorStatistics(errors: SystemError[]) {
  const byType: { [key: string]: number } = {};
  const bySeverity: { [key: string]: number } = {};
  const byBrowser: { [key: string]: number } = {};
  const byOS: { [key: string]: number } = {};
  const errorTrend: { date: string; count: number }[] = [];

  // Initialize errorTrend for the last 7 days
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    errorTrend.push({ date: date.toISOString().split('T')[0], count: 0 });
  }

  errors.forEach(error => {
    byType[error.error_type] = (byType[error.error_type] || 0) + 1;
    bySeverity[error.severity || 'medium'] = (bySeverity[error.severity || 'medium'] || 0) + 1;

    // Parse user agent for browser and OS
    console.log(`[DEBUG] Processing error ID: ${error.id}, Type: ${error.error_type}, Raw User Agent: "${error.user_agent}"`); // Debug log

    let browser = 'Unknown';
    let os = 'Unknown';

    // Check if user_agent is a non-empty string and not literally "null"
    if (error.user_agent && typeof error.user_agent === 'string' && error.user_agent.trim() !== '' && error.user_agent.toLowerCase() !== 'null') {
      const userAgent = error.user_agent.toLowerCase();

      if (userAgent.includes('chrome') && !userAgent.includes('chromium')) browser = 'Chrome';
      else if (userAgent.includes('firefox')) browser = 'Firefox';
      else if (userAgent.includes('safari') && !userAgent.includes('chrome')) browser = 'Safari';
      else if (userAgent.includes('edge')) browser = 'Edge';
      else if (userAgent.includes('opera')) browser = 'Opera';

      if (userAgent.includes('windows')) os = 'Windows';
      else if (userAgent.includes('mac os')) os = 'macOS';
      else if (userAgent.includes('linux')) os = 'Linux';
      else if (userAgent.includes('android')) os = 'Android';
      else if (userAgent.includes('ios')) os = 'iOS';
    }
    
    byBrowser[browser] = (byBrowser[browser] || 0) + 1;
    byOS[os] = (byOS[os] || 0) + 1;

    // Update error trend
    if (error.created_at) {
      const errorDate = new Date(error.created_at).toISOString().split('T')[0];
      const trendEntry = errorTrend.find(entry => entry.date === errorDate);
      if (trendEntry) {
        trendEntry.count++;
      }
    }
  });

  const totalErrors = errors.length;
  const criticalErrors = bySeverity['critical'] || 0;
  const resolvedErrors = errors.filter(e => e.status === 'resolved').length;
  const errorRate = totalErrors > 0 ? (criticalErrors / totalErrors) * 100 : 0;

  const topErrorTypes = Object.entries(byType)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  console.log('getErrorStatistics - Final byBrowser:', byBrowser); // New debug log
  console.log('getErrorStatistics - Final byOS:', byOS);     // New debug log

  return {
    totalErrors,
    criticalErrors,
    resolvedErrors,
    errorRate,
    topErrorTypes,
    errorTrend,
    byType,
    bySeverity,
    byBrowser,
    byOS,
    recent: errors.slice(0, 10)
  };
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