import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser } from '@/services/secureAuthService';
import { logSecurityEvent } from '@/utils/secureAuthUtils';
import { logSecurityEventRealTime } from '@/utils/realTimeSecurityUtils';
import { setupGlobalErrorHandling, captureError } from '@/utils/errorTracking';
import { setupUsageTracking, endUserSession } from '@/utils/usageTracking';
import { setSupabaseAuth, clearSupabaseAuth } from '@/integrations/supabase/client';
import { setAuthentication, clearAuthentication } from '@/utils/supabaseAuth';
import { healthCheckService } from '@/services/healthCheckService';

interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setup global error handling
    setupGlobalErrorHandling();

    // Check for existing session on app start
    const checkExistingSession = async () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Set authentication in both clients
          setSupabaseAuth(storedToken, userData.username);
          setAuthentication(storedToken, userData.username);
          
          // Wait for authentication to be fully set up before starting tracking
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Setup usage tracking for restored session
          setupUsageTracking(userData.username);
          
          // Start health monitoring for authenticated user
          healthCheckService.onUserLogin();
          
          logSecurityEvent('SESSION_RESTORED', { username: userData.username });
          logSecurityEventRealTime('SESSION_RESTORED', { username: userData.username }, userData.username);
          console.log('🔐 Session restored for user:', userData.username);
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        captureError(error as Error, {
          functionName: 'checkExistingSession',
          severity: 'medium'
        });
        
        // Clear invalid session data
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        clearSupabaseAuth();
        clearAuthentication();
        logSecurityEventRealTime('SESSION_RESTORE_FAILED', { error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Monitor for suspicious activity
  useEffect(() => {
    if (user) {
      // Log user session start
      logSecurityEventRealTime('SESSION_START', {
        timestamp: new Date().toISOString()
      }, user.username);

      // Set up periodic session validation
      const sessionInterval = setInterval(async () => {
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            await logSecurityEventRealTime('SESSION_EXPIRED', {
              reason: 'No token found'
            }, user.username);
            logout();
            return;
          }
        } catch (error) {
          console.error('Session validation error:', error);
          captureError(error as Error, {
            functionName: 'sessionValidation',
            userId: user.username,
            severity: 'medium'
          });
          await logSecurityEventRealTime('SESSION_VALIDATION_ERROR', {
            error: error instanceof Error ? error.message : 'Unknown error'
          }, user.username);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => {
        clearInterval(sessionInterval);
        // End user session
        endUserSession();
        // Log session end
        logSecurityEventRealTime('SESSION_END', {
          timestamp: new Date().toISOString()
        }, user.username);
      };
    }
  }, [user]);

  // Monitor for page visibility changes (potential security concern)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user) {
        logSecurityEventRealTime(
          document.hidden ? 'PAGE_HIDDEN' : 'PAGE_VISIBLE',
          { timestamp: new Date().toISOString() },
          user.username
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const result = await secureLoginUser(username, password);
      
      if (result.success && result.user && result.token) {
        setUser(result.user);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
        localStorage.setItem('auth_token', result.token);
        
        // Set authentication in both clients
        setSupabaseAuth(result.token, result.user.username);
        setAuthentication(result.token, result.user.username);
        
        // Wait for authentication to be fully set up before starting tracking
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Setup usage tracking for new session
        setupUsageTracking(result.user.username);
        
        // Start health monitoring for authenticated user
        healthCheckService.onUserLogin();
        
        logSecurityEvent('LOGIN_SUCCESS', { username });
        logSecurityEventRealTime('LOGIN_SUCCESS', {
          username,
          role: result.user.role,
          department: result.user.department,
          timestamp: new Date().toISOString()
        }, username);
        console.log('🔐 User logged in and Supabase auth set:', username);
        
        return { success: true };
      } else {
        logSecurityEvent('LOGIN_FAILED', { username, error: result.error });
        logSecurityEventRealTime('LOGIN_FAILED', { 
          username, 
          error: result.error,
          timestamp: new Date().toISOString()
        }, username);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      captureError(error as Error, {
        functionName: 'login',
        userId: username,
        severity: 'high'
      });
      logSecurityEvent('LOGIN_ERROR', { username, error: error instanceof Error ? error.message : 'Unknown error' });
      logSecurityEventRealTime('LOGIN_ERROR', { 
        username, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, username);
      return { success: false, error: 'Đã xảy ra lỗi trong quá trình đăng nhập' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (user) {
      // End user session
      endUserSession();
      
      // Stop health monitoring
      healthCheckService.onUserLogout();
      
      logSecurityEvent('LOGOUT', { username: user.username });
      logSecurityEventRealTime('LOGOUT_SUCCESS', {
        timestamp: new Date().toISOString()
      }, user.username);
      console.log('🔓 User logging out:', user.username);
    }
    
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    
    // Clear authentication in both clients
    clearSupabaseAuth();
    clearAuthentication();
    
    // Clear any other user-specific data
    localStorage.removeItem('user_preferences');
    localStorage.removeItem('notification-permission-dismissed');
    localStorage.removeItem('pwa-install-dismissed');
    
    console.log('🔓 User logged out and Supabase auth cleared');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Primary hook name
export function useSecureAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within an AuthProvider');
  }
  return context;
}

// Alias for backward compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Default export for convenience
export default AuthProvider;