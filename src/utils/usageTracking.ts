import { supabase } from '@/integrations/supabase/client';

export interface UserSession {
  id?: string;
  username: string;
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  pages_visited: number;
  actions_performed: number;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser_name?: string;
  os_name?: string;
  session_data?: any;
  updated_at?: string; // Add this field
}

export interface UsageStats {
  hourly: { [hour: string]: number };
  daily: { [date: string]: number };
  monthly: { [month: string]: number };
  quarterly: { [quarter: string]: number };
  yearly: { [year: string]: number };
}

// Start user session
export async function startUserSession(username: string): Promise<string | null> {
  try {
    const deviceInfo = getDeviceInfo();
    
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        username,
        session_start: new Date().toISOString(),
        pages_visited: 1,
        actions_performed: 0,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        device_type: deviceInfo.deviceType,
        browser_name: deviceInfo.browserName,
        os_name: deviceInfo.osName,
        session_data: {
          screen_resolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        }
      })
      .select()
      .single();

    if (error) throw error;
    
    // Store session ID in localStorage for tracking
    localStorage.setItem('current_session_id', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Failed to start user session:', error);
    return null;
  }
}

// Update user session
export async function updateUserSession(sessionId: string, updates: Partial<UserSession>) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Failed to update user session:', error);
  }
}

// End user session
export async function endUserSession(sessionId: string) {
  try {
    const sessionEnd = new Date();
    
    // Get session start time
    const { data: session } = await supabase
      .from('user_sessions')
      .select('session_start')
      .eq('id', sessionId)
      .single();

    if (session) {
      const sessionStart = new Date(session.session_start);
      const durationMinutes = Math.round((sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60));

      await supabase
        .from('user_sessions')
        .update({
          session_end: sessionEnd.toISOString(),
          duration_minutes: durationMinutes,
          updated_at: sessionEnd.toISOString()
        })
        .eq('id', sessionId);
    }

    localStorage.removeItem('current_session_id');
  } catch (error) {
    console.error('❌ Failed to end user session:', error);
  }
}

// Track page visit
export async function trackPageVisit(page: string) {
  const sessionId = localStorage.getItem('current_session_id');
  if (!sessionId) return;

  try {
    // Increment pages visited
    const { data: session } = await supabase
      .from('user_sessions')
      .select('pages_visited, session_data')
      .eq('id', sessionId)
      .single();

    if (session) {
      const updatedSessionData = {
        ...session.session_data,
        pages: [...(session.session_data?.pages || []), {
          page,
          timestamp: new Date().toISOString(),
          referrer: document.referrer
        }]
      };

      await updateUserSession(sessionId, {
        pages_visited: session.pages_visited + 1,
        session_data: updatedSessionData
      });
    }
  } catch (error) {
    console.error('❌ Failed to track page visit:', error);
  }
}

// Track user action
export async function trackUserAction(action: string, data?: any) {
  const sessionId = localStorage.getItem('current_session_id');
  if (!sessionId) return;

  try {
    // Increment actions performed
    const { data: session } = await supabase
      .from('user_sessions')
      .select('actions_performed, session_data')
      .eq('id', sessionId)
      .single();

    if (session) {
      const updatedSessionData = {
        ...session.session_data,
        actions: [...(session.session_data?.actions || []), {
          action,
          timestamp: new Date().toISOString(),
          data
        }]
      };

      await updateUserSession(sessionId, {
        actions_performed: session.actions_performed + 1,
        session_data: updatedSessionData
      });
    }
  } catch (error) {
    console.error('❌ Failed to track user action:', error);
  }
}

// Get usage statistics
export async function getUsageStats(timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<UsageStats> {
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
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .gte('session_start', startDate.toISOString())
      .order('session_start', { ascending: true });

    if (error) throw error;

    const stats: UsageStats = {
      hourly: {},
      daily: {},
      monthly: {},
      quarterly: {},
      yearly: {}
    };

    sessions?.forEach(session => {
      const date = new Date(session.session_start);
      
      // Hourly stats
      const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      stats.hourly[hourKey] = (stats.hourly[hourKey] || 0) + 1;
      
      // Daily stats
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      stats.daily[dayKey] = (stats.daily[dayKey] || 0) + 1;
      
      // Monthly stats
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      stats.monthly[monthKey] = (stats.monthly[monthKey] || 0) + 1;
      
      // Quarterly stats
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const quarterKey = `${date.getFullYear()}-Q${quarter}`;
      stats.quarterly[quarterKey] = (stats.quarterly[quarterKey] || 0) + 1;
      
      // Yearly stats
      const yearKey = `${date.getFullYear()}`;
      stats.yearly[yearKey] = (stats.yearly[yearKey] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Failed to get usage stats:', error);
    return {
      hourly: {},
      daily: {},
      monthly: {},
      quarterly: {},
      yearly: {}
    };
  }
}

// Get average session duration - Fix parameter type
export async function getAverageSessionDuration(timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<number> {
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
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('duration_minutes')
      .gte('session_start', startDate.toISOString())
      .not('duration_minutes', 'is', null);

    if (error) throw error;

    if (!sessions || sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    return Math.round(totalDuration / sessions.length);
  } catch (error) {
    console.error('❌ Failed to get average session duration:', error);
    return 0;
  }
}

// Get device info
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  
  // Detect device type
  let deviceType = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    deviceType = 'mobile';
  }

  // Detect browser
  let browserName = 'unknown';
  if (userAgent.includes('Chrome')) browserName = 'Chrome';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Safari')) browserName = 'Safari';
  else if (userAgent.includes('Edge')) browserName = 'Edge';
  else if (userAgent.includes('Opera')) browserName = 'Opera';

  // Detect OS
  let osName = 'unknown';
  if (userAgent.includes('Windows')) osName = 'Windows';
  else if (userAgent.includes('Mac')) osName = 'macOS';
  else if (userAgent.includes('Linux')) osName = 'Linux';
  else if (userAgent.includes('Android')) osName = 'Android';
  else if (userAgent.includes('iOS')) osName = 'iOS';

  return { deviceType, browserName, osName };
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

// Setup usage tracking
export function setupUsageTracking(username: string) {
  // Start session
  startUserSession(username);

  // Track page changes
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      trackPageVisit(currentPath);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Track user interactions
  ['click', 'keydown', 'scroll'].forEach(eventType => {
    document.addEventListener(eventType, () => {
      trackUserAction(eventType);
    }, { passive: true });
  });

  // End session on page unload
  window.addEventListener('beforeunload', () => {
    const sessionId = localStorage.getItem('current_session_id');
    if (sessionId) {
      endUserSession(sessionId);
    }
  });

  // Periodic session update (every 5 minutes)
  setInterval(() => {
    const sessionId = localStorage.getItem('current_session_id');
    if (sessionId) {
      updateUserSession(sessionId, {
        updated_at: new Date().toISOString()
      });
    }
  }, 5 * 60 * 1000);
}