export interface SecurityEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function logSecurityEvent(eventType: string, data: any): void {
  const event: SecurityEvent = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  };
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`🔒 Security Event [${eventType}]:`, data);
  }
  
  // In production, you might want to send this to a logging service
  // For now, we'll just store it locally for debugging
  try {
    const events = getStoredSecurityEvents();
    events.push(event);
    
    // Keep only the last 100 events to prevent storage bloat
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('security_events', JSON.stringify(events));
  } catch (error) {
    console.error('Failed to store security event:', error);
  }
}

export function getStoredSecurityEvents(): SecurityEvent[] {
  try {
    const stored = localStorage.getItem('security_events');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get stored security events:', error);
    return [];
  }
}

export function clearSecurityEvents(): void {
  try {
    localStorage.removeItem('security_events');
  } catch (error) {
    console.error('Failed to clear security events:', error);
  }
}

export function validateUsername(username: string): boolean {
  // Basic username validation
  if (!username || username.length < 3) {
    return false;
  }
  
  // Check for basic security patterns
  const dangerousPatterns = [
    /[<>]/,  // HTML tags
    /['"]/,  // Quotes
    /[;]/,   // SQL injection attempts
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(username));
}

export function validatePassword(password: string): boolean {
  // Basic password validation
  return password && password.length >= 6;
}