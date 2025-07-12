import { supabase } from '@/integrations/supabase/client';
import { isDevelopment } from '@/config';

export interface SecurityEvent {
  id: string; // Thêm id để phân biệt các sự kiện
  type: string;
  timestamp: string;
  data: any;
  userAgent: string;
  ip?: string;
  username?: string;
}

export interface RealTimeSecurityStats {
  activeConnections: number;
  recentEvents: SecurityEvent[];
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  // Thêm các số liệu chi tiết
  loginAttempts: number;
  failedLogins: number;
  successfulLogins: number;
  accountLocks: number;
  passwordResets: number;
  suspiciousActivities: number;
}

// Log security event to both database and localStorage
export async function logSecurityEventRealTime(
  eventType: string, 
  data: any = {}, 
  username?: string
) {
  const event: SecurityEvent = {
    id: crypto.randomUUID(), // Tạo ID duy nhất
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
    userAgent: navigator.userAgent,
    username
  };

  // Log to console in development
  if (isDevelopment) {
    console.log(`[SECURITY REALTIME] ${eventType}:`, event);
  }

  // Store in localStorage for immediate access
  try {
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    const updatedLogs = [event, ...existingLogs].slice(0, 100);
    localStorage.setItem('security_logs', JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error storing security log locally:', error);
  }

  // Store in database for persistence and real-time updates
  try {
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        username: username,
        event_data: data,
        user_agent: navigator.userAgent,
        ip_address: await getClientIP()
      });

    if (error) {
      console.error('Error storing security event in database:', error);
    }
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

// Get client IP address (simplified version)
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return null;
  }
}

// Subscribe to real-time security events
export function subscribeToSecurityEvents(
  callback: (event: SecurityEvent) => void
) {
  const channel = supabase
    .channel('security_events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'security_events'
      },
      (payload) => {
        const event: SecurityEvent = {
          id: payload.new.id, // Sử dụng ID từ payload
          type: payload.new.event_type,
          timestamp: payload.new.created_at,
          data: payload.new.event_data,
          userAgent: payload.new.user_agent,
          ip: payload.new.ip_address,
          username: payload.new.username
        };
        callback(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Get real-time security statistics
export async function getRealTimeSecurityStats(): Promise<RealTimeSecurityStats> {
  try {
    // Get recent events from database (last 5 minutes for metrics)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: events, error } = await supabase
      .from('security_events')
      .select('*')
      .gte('created_at', fiveMinutesAgo) // Lọc sự kiện trong 5 phút gần nhất
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const recentEvents: SecurityEvent[] = events?.map(event => ({
      id: event.id,
      type: event.event_type,
      timestamp: event.created_at,
      data: event.event_data,
      userAgent: event.user_agent,
      ip: event.ip_address,
      username: event.username
    })) || [];

    // Calculate detailed metrics
    const loginAttempts = recentEvents.filter(e => e.type === 'LOGIN_ATTEMPT').length;
    const failedLogins = recentEvents.filter(e => e.type === 'LOGIN_FAILED').length;
    const successfulLogins = recentEvents.filter(e => e.type === 'LOGIN_SUCCESS').length;
    const accountLocks = recentEvents.filter(e => e.type === 'ACCOUNT_LOCKED').length;
    const passwordResets = recentEvents.filter(e => e.type === 'PASSWORD_RESET').length;
    const suspiciousActivities = recentEvents.filter(e => 
      e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED'
    ).length;

    // Calculate threat level based on recent events
    const threatLevel = calculateThreatLevel(recentEvents);
    
    // Calculate system health
    const systemHealth = calculateSystemHealth(recentEvents);

    // Count active connections (simplified)
    const activeConnections = await getActiveConnections();

    return {
      activeConnections,
      recentEvents,
      threatLevel,
      systemHealth,
      loginAttempts,
      failedLogins,
      successfulLogins,
      accountLocks,
      passwordResets,
      suspiciousActivities
    };
  } catch (error) {
    console.error('Error getting real-time security stats:', error);
    return {
      activeConnections: 0,
      recentEvents: [],
      threatLevel: 'LOW',
      systemHealth: 'HEALTHY',
      loginAttempts: 0,
      failedLogins: 0,
      successfulLogins: 0,
      accountLocks: 0,
      passwordResets: 0,
      suspiciousActivities: 0
    };
  }
}

function calculateThreatLevel(events: SecurityEvent[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const recentEvents = events.filter(event => {
    const eventTime = new Date(event.timestamp).getTime();
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return eventTime > oneHourAgo;
  });

  const failedLogins = recentEvents.filter(e => e.type === 'LOGIN_FAILED').length;
  const suspiciousActivities = recentEvents.filter(e => 
    e.type === 'SUSPICIOUS_ACTIVITY' || e.type === 'RATE_LIMIT_EXCEEDED'
  ).length;

  if (failedLogins >= 20 || suspiciousActivities >= 10) return 'CRITICAL';
  if (failedLogins >= 10 || suspiciousActivities >= 5) return 'HIGH';
  if (failedLogins >= 5 || suspiciousActivities >= 2) return 'MEDIUM';
  return 'LOW';
}

function calculateSystemHealth(events: SecurityEvent[]): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
  const recentEvents = events.filter(event => {
    const eventTime = new Date(event.timestamp).getTime();
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    return eventTime > thirtyMinutesAgo;
  });

  const errorEvents = recentEvents.filter(e => 
    e.type.includes('ERROR') || e.type.includes('FAILED')
  ).length;

  if (errorEvents >= 10) return 'CRITICAL';
  if (errorEvents >= 5) return 'WARNING';
  return 'HEALTHY';
}

async function getActiveConnections(): Promise<number> {
  try {
    // Get users who have been active in the last 5 minutes
    const { data: activeUsers, error } = await supabase
      .from('security_events')
      .select('username')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .not('username', 'is', null);

    if (error) throw error;

    // Count unique active users
    const uniqueUsers = new Set(activeUsers?.map(u => u.username) || []);
    return uniqueUsers.size;
  } catch (error) {
    console.error('Error getting active connections:', error);
    return 0;
  }
}

// Clean up old security events (run periodically)
export async function cleanupOldSecurityEvents(daysToKeep: number = 30) {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const { error } = await supabase
      .from('security_events')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    logSecurityEventRealTime('CLEANUP_COMPLETED', { 
      daysToKeep, 
      cutoffDate: cutoffDate.toISOString() 
    });
  } catch (error) {
    console.error('Error cleaning up old security events:', error);
    logSecurityEventRealTime('CLEANUP_FAILED', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Export enhanced security monitoring functions
export {
  logSecurityEvent,
  getSecurityLogs,
  clearSecurityLogs,
  validateToken,
  sanitizeInput,
  isValidUsername,
  isStrongPassword,
  generateSecureId,
  hashString,
  detectSuspiciousActivity,
  rateLimit,
  clearRateLimit
} from './secureAuthUtils';