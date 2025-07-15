import { logSystemError, createSystemAlert, logSystemMetric } from '@/services/systemLogService';
import { errorNotifierService } from '@/services/notifications/errorNotifierService';
import { SystemError } from '@/types/system';

let globalErrorHandler: ((error: Error, context?: any) => void) | null = null;

export async function captureError(
  error: Error,
  context?: {
    functionName?: string;
    userId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    additionalData?: any;
    errorType?: string;
    disableEmail?: boolean;
    disablePush?: boolean;
  }
): Promise<void> {
  const errorData: SystemError = {
    error_type: context?.errorType || error.name || 'Error',
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

  await errorNotifierService.notifyAdmins(errorData, {
    disableEmail: context?.disableEmail,
    disablePush: context?.disablePush,
  });

  if (errorData.severity === 'critical') {
    await createSystemAlert({
      alert_id: crypto.randomUUID(),
      rule_name: 'Critical Application Error Detected',
      severity: 'critical',
      message: `Lỗi nghiêm trọng: ${errorData.error_message} tại ${errorData.function_name || 'unknown function'}.`,
      metric: 'error_count',
      current_value: 1,
      threshold: 0,
      acknowledged: false,
      rule_id: 'critical_application_error',
    });
  }

  if (error.message.includes('timeout') || error.message.includes('slow')) {
    await logSystemMetric({
      metric_type: 'error',
      metric_name: 'error_count',
      metric_value: 1,
      metric_unit: 'count',
      additional_data: { error_type: error.name, function_name: context?.functionName }
    });
  }

  if (globalErrorHandler) {
    try {
      globalErrorHandler(error, context);
    } catch (handlerError) {
      console.error('❌ Global error handler failed:', handlerError);
    }
  }
}

export function setupGlobalErrorHandling(): void {
  const handleError = (error: Error, context: any) => {
    captureError(error, context);
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    handleError(error, { functionName: 'unhandledrejection', severity: 'high', additionalData: { type: 'unhandled_promise_rejection' } });
  });

  window.addEventListener('error', (event) => {
    console.error('🚨 Uncaught error:', event.error);
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    handleError(error, { functionName: 'uncaught_error', severity: 'high', additionalData: { type: 'uncaught_error', filename: event.filename, lineno: event.lineno, colno: event.colno } });
  });

  console.log('🛡️ Global error handling setup completed');
}

export function setGlobalErrorHandler(handler: (error: Error, context?: any) => void): void {
  globalErrorHandler = handler;
}