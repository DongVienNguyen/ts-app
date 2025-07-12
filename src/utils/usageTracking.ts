import { supabase } from '@/integrations/supabase/client';

interface UserSession {
  id?: string;
  username: string;
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  pages_visited: number;
  actions_performed: number;
  ip_address?: string | null;
  user_agent?: string;
  device_type?: string;
  browser_name?: string;
  os_name?: string;
  session_data?: any;
}

interface PageView {
  page: string;
  timestamp: string;
  duration?: number;
}

interface UserAction {
  action: string;
  timestamp: string;
  data?: any;
}

// Current session data
let currentSession: UserSession | null = null;
let sessionStartTime: number = 0;
let pageViews: PageView[] = [];
let userActions: UserAction[] = [];
let currentPageStart: number = 0;
let currentPage: string = '';

// Get device info
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  
  // Detect device type
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  // Detect browser
  let browserName = 'unknown';
  if (userAgent.includes('Chrome')) browserName = 'Chrome';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Safari')) browserName = 'Safari';
  else if (userAgent.includes('Edge')) browserName = 'Edge';
  
  // Detect OS
  let osName = 'unknown';
  if (userAgent.includes('Windows')) osName = 'Windows';
  else if (userAgent.includes('Mac')) osName = 'macOS';
  else if (userAgent.includes('Linux')) osName = 'Linux';
  else if (userAgent.includes('Android')) osName = 'Android';
  else if (userAgent.includes('iOS')) osName = 'iOS';
  
  return { deviceType, browserName, osName };
}

// Get client IP (fallback method)
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return null;
  }
}

// Check if user is authenticated
async function isUserAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// Get average session duration
export async function getAverageSessionDuration(timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year'): Promise<number> {
  try {
    if (!(await isUserAuthenticated())) { // Await the async function
      console.warn('⚠️ Cannot get session duration: not authenticated');
      return 0;
    }

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

    if (!sessions || sessions.length === 0) {
      return 0;
    }

    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    return Math.round(totalDuration / sessions.length);
  } catch (error) {
    console.error('Error getting average session duration:', error);
    return 0;
  }
}

// Start user session
export async function startUserSession(username: string): Promise<void> {
  try {
    // Wait a bit for authentication to be fully set up
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!(await isUserAuthenticated())) { // Await the async function
      console.warn('⚠️ Could not start user session - not authenticated');
      // Create a local session if database fails
      currentSession = {
        username,
        session_start: new Date().toISOString(),
        pages_visited: 0,
        actions_performed: 0,
        ...getDeviceInfo()
      };
      return;
    }

    sessionStartTime = Date.now();
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getClientIP();
    
    const sessionData: Omit<UserSession, 'id'> = {
      username,
      session_start: new Date().toISOString(),
      pages_visited: 0,
      actions_performed: 0,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      device_type: deviceInfo.deviceType,
      browser_name: deviceInfo.browserName,
      os_name: deviceInfo.osName,
      session_data: {
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    };

    const { data, error } = await supabase
      .from('user_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;

    currentSession = data;
    console.log('✅ User session started successfully');

  } catch (error) {
    console.error('❌ Failed to start user session:', error);
    // Create a local session if database fails
    currentSession = {
      username,
      session_start: new Date().toISOString(),
      pages_visited: 0,
      actions_performed: 0,
      ...getDeviceInfo()
    };
  }
}

// End user session
export async function endUserSession(): Promise<void> {
  if (!currentSession) return;

  try {
    if (!(await isUserAuthenticated()) || !currentSession.id) { // Await the async function
      console.warn('⚠️ Cannot end user session - not authenticated or no session ID');
      return;
    }

    const sessionEnd = new Date().toISOString();
    const durationMinutes = Math.round((Date.now() - sessionStartTime) / 60000);

    const updateData = {
      session_end: sessionEnd,
      duration_minutes: durationMinutes,
      pages_visited: pageViews.length,
      actions_performed: userActions.length,
      session_data: {
        ...currentSession.session_data,
        page_views: pageViews,
        user_actions: userActions.slice(-50) // Keep last 50 actions
      }
    };

    const { error } = await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('id', currentSession.id);

    if (error) throw error;

    console.log('✅ User session ended successfully');
  } catch (error) {
    console.error('❌ Failed to end user session:', error);
  } finally {
    // Reset session data
    currentSession = null;
    sessionStartTime = 0;
    pageViews = [];
    userActions = [];
    currentPageStart = 0;
    currentPage = '';
  }
}

// Track page view
export function trackPageView(page: string): void {
  // End previous page view
  if (currentPage && currentPageStart > 0) {
    const duration = Date.now() - currentPageStart;
    pageViews.push({
      page: currentPage,
      timestamp: new Date(currentPageStart).toISOString(),
      duration: Math.round(duration / 1000) // in seconds
    });
  }

  // Start new page view
  currentPage = page;
  currentPageStart = Date.now();
  
  pageViews.push({
    page,
    timestamp: new Date().toISOString()
  });

  console.log(`📄 Page view tracked: ${page}`);
}

// Track user action
export function trackUserAction(action: string, data?: any): void {
  userActions.push({
    action,
    timestamp: new Date().toISOString(),
    data
  });

  // Keep only last 100 actions in memory
  if (userActions.length > 100) {
    userActions = userActions.slice(-100);
  }

  console.log(`🎯 User action tracked: ${action}`);
}

// Update session periodically
export async function updateSession(): Promise<void> {
  if (!currentSession?.id) return;

  try {
    if (!(await isUserAuthenticated())) { // Await the async function
      console.warn('⚠️ Cannot update session - not authenticated');
      return;
    }

    const updateData = {
      pages_visited: pageViews.length,
      actions_performed: userActions.length,
      session_data: {
        ...currentSession.session_data,
        last_activity: new Date().toISOString(),
        page_views: pageViews.slice(-20), // Keep last 20 page views
        user_actions: userActions.slice(-20) // Keep last 20 actions
      }
    };

    const { error } = await supabase
      .from('user_sessions')
      .update(updateData)
      .eq('id', currentSession.id);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Failed to update session:', error);
  }
}

// Get session statistics
export function getSessionStats() {
  if (!currentSession) return null;

  const currentDuration = Math.round((Date.now() - sessionStartTime) / 60000);
  
  return {
    username: currentSession.username,
    duration: currentDuration,
    pagesVisited: pageViews.length,
    actionsPerformed: userActions.length,
    currentPage,
    deviceInfo: {
      type: currentSession.device_type,
      browser: currentSession.browser_name,
      os: currentSession.os_name
    }
  };
}

// Setup usage tracking
export function setupUsageTracking(username: string): void {
  // Start session
  startUserSession(username);

  // Track initial page
  trackPageView(window.location.pathname);

  // Track page changes (for SPAs)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      trackPageView(window.location.pathname);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Track user interactions
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
      const actionName = target.textContent?.trim() || target.getAttribute('aria-label') || 'click';
      trackUserAction('click', {
        element: target.tagName,
        text: actionName,
        page: window.location.pathname
      });
    }
  });

  // Update session every 5 minutes
  const updateInterval = setInterval(updateSession, 5 * 60 * 1000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(updateInterval);
    observer.disconnect();
    endUserSession();
  });

  // Handle visibility change (tab switching)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      trackUserAction('tab_hidden');
    } else {
      trackUserAction('tab_visible');
    }
  });

  console.log('📊 Usage tracking setup completed for user:', username);
}

// Cleanup usage tracking
export function cleanupUsageTracking(): void {
  endUserSession();
}