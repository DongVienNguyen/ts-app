import { isDevelopment } from '@/config';

export interface SecurityEvent {
  type: string;
  timestamp: string;
  data: any;
  userAgent: string;
  ip?: string;
}

export function logSecurityEvent(eventType: string, data: any = {}) {
  const event: SecurityEvent = {
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (isDevelopment) {
    console.log(`[SECURITY] ${eventType}:`, event);
  }

  // Store in localStorage for debugging (limit to last 100 events)
  try {
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    const updatedLogs = [event, ...existingLogs].slice(0, 100);
    localStorage.setItem('security_logs', JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error storing security log:', error);
  }

  // In production, you might want to send this to a logging service
  if (!isDevelopment) {
    // Example: Send to logging service
    // sendToLoggingService(event);
  }
}

export function getSecurityLogs(): SecurityEvent[] {
  try {
    return JSON.parse(localStorage.getItem('security_logs') || '[]');
  } catch (error) {
    console.error('Error retrieving security logs:', error);
    return [];
  }
}

export function clearSecurityLogs() {
  localStorage.removeItem('security_logs');
}

export function validateToken(token: string): boolean {
  if (!token) return false;
  
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload (without verification for client-side)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      logSecurityEvent('TOKEN_EXPIRED', { exp: payload.exp });
      return false;
    }
    
    return true;
  } catch (error) {
    logSecurityEvent('TOKEN_VALIDATION_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .slice(0, 255); // Limit length
}

export function isValidUsername(username: string): boolean {
  // Username should be alphanumeric, 3-50 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
}

export function isStrongPassword(password: string): boolean {
  // At least 8 characters, contains uppercase, lowercase, number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

export function detectSuspiciousActivity(events: SecurityEvent[]): boolean {
  const recentEvents = events.filter(event => {
    const eventTime = new Date(event.timestamp).getTime();
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return eventTime > fiveMinutesAgo;
  });

  // Check for multiple failed login attempts
  const failedLogins = recentEvents.filter(event => 
    event.type === 'LOGIN_FAILED' || event.type === 'LOGIN_ERROR'
  );

  if (failedLogins.length >= 5) {
    logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', { 
      reason: 'Multiple failed login attempts',
      count: failedLogins.length 
    });
    return true;
  }

  return false;
}

export function rateLimit(key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  try {
    const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
    const recentAttempts = attempts.filter((timestamp: number) => timestamp > windowStart);
    
    if (recentAttempts.length >= maxAttempts) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { key, attempts: recentAttempts.length });
      return false;
    }
    
    recentAttempts.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
}

export function clearRateLimit(key: string) {
  localStorage.removeItem(`rate_limit_${key}`);
}