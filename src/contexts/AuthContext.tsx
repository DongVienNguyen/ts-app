import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser } from '@/services/secureAuthService';
import { clearSupabaseAuth, setSupabaseAuth } from '@/integrations/supabase/client';
import { healthCheckService } from '@/services/healthCheckService';
import { toast } from 'sonner';

// Extend Staff type to include token
interface AuthenticatedStaff extends Staff {
  token?: string;
}

interface AuthContextType {
  user: AuthenticatedStaff | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Enhanced session validation with correct token format handling
  const validateAndRestoreSession = async (): Promise<AuthenticatedStaff | null> => {
    try {
      console.log('🔍 [AUTH] Starting session validation...');
      
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      const loginTime = localStorage.getItem('auth_login_time');
      
      // Check if all required data exists
      if (!token || !userStr || !loginTime) {
        console.log('❌ [AUTH] Missing session data:', { 
          hasToken: !!token, 
          hasUser: !!userStr, 
          hasLoginTime: !!loginTime 
        });
        return null;
      }

      // Validate login timestamp
      const loginTimestamp = parseInt(loginTime);
      if (isNaN(loginTimestamp) || loginTimestamp <= 0) {
        console.log('❌ [AUTH] Invalid login timestamp:', loginTime);
        return null;
      }

      // Check session age (7 days = 604800000 ms)
      const now = Date.now();
      const sessionAge = now - loginTimestamp;
      const maxSessionAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (sessionAge > maxSessionAge) {
        console.log('❌ [AUTH] Session expired:', {
          sessionAgeHours: Math.round(sessionAge / (60 * 60 * 1000)),
          maxAgeHours: Math.round(maxSessionAge / (60 * 60 * 1000)),
          loginDate: new Date(loginTimestamp).toISOString()
        });
        return null;
      }

      // Validate token format - our token is base64 encoded JSON, not JWT
      try {
        console.log('🔍 [AUTH] Token format check, length:', token.length);
        
        // Try to decode the token (it's base64 encoded JSON from edge function)
        const payload = JSON.parse(atob(token));
        console.log('✅ [AUTH] Token decoded successfully:', {
          username: payload.username,
          role: payload.role,
          hasExp: !!payload.exp
        });
        
        // Check token expiration if present
        if (payload.exp) {
          const currentTime = Date.now(); // Use milliseconds, not seconds
          if (payload.exp < currentTime) {
            console.log('❌ [AUTH] Token expired:', {
              tokenExp: payload.exp,
              currentTime: currentTime,
              expiredMs: currentTime - payload.exp
            });
            return null;
          }
          
          console.log('✅ [AUTH] Token valid:', {
            exp: payload.exp,
            timeUntilExp: Math.round((payload.exp - currentTime) / (60 * 60 * 1000)) + ' hours',
            username: payload.username
          });
        } else {
          console.log('✅ [AUTH] Token has no expiration');
        }
      } catch (tokenError) {
        console.log('❌ [AUTH] Token parsing error:', tokenError);
        return null;
      }

      // Parse and validate user data
      let userData: Staff;
      try {
        userData = JSON.parse(userStr);
        
        // Validate required user fields
        if (!userData.username || !userData.role) {
          console.log('❌ [AUTH] Invalid user data structure:', {
            hasUsername: !!userData.username,
            hasRole: !!userData.role,
            userData: userData
          });
          return null;
        }
      } catch (userError) {
        console.log('❌ [AUTH] User data parsing error:', userError);
        return null;
      }

      console.log('✅ [AUTH] Session validation successful:', {
        username: userData.username,
        role: userData.role,
        department: userData.department,
        sessionAgeHours: Math.round(sessionAge / (60 * 60 * 1000)),
        loginDate: new Date(loginTimestamp).toLocaleString()
      });

      return { ...userData, token };
    } catch (error) {
      console.error('❌ [AUTH] Session validation error:', error);
      return null;
    }
  };

  // Clear invalid session data
  const clearSessionData = () => {
    console.log('🧹 [AUTH] Clearing session data...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_login_time');
    
    // Clear legacy keys
    localStorage.removeItem('secure_user');
    localStorage.removeItem('secure_token');
    localStorage.removeItem('loggedInStaff');
    localStorage.removeItem('currentUser');
  };

  const checkAuth = async () => {
    try {
      console.log('🔄 [AUTH] Checking authentication state...');
      
      const currentUser = await validateAndRestoreSession();
      
      if (currentUser) {
        console.log('✅ [AUTH] User authenticated successfully:', currentUser.username);
        setUser(currentUser);
        setSupabaseAuth(currentUser.token || '', currentUser.username);
        healthCheckService.onUserLogin();
      } else {
        console.log('❌ [AUTH] No valid session found, clearing data');
        clearSessionData();
        setUser(null);
        clearSupabaseAuth();
        healthCheckService.onUserLogout();
      }
    } catch (error) {
      console.error('❌ [AUTH] Auth check failed:', error);
      clearSessionData();
      setUser(null);
      clearSupabaseAuth();
      healthCheckService.onUserLogout();
    } finally {
      setLoading(false);
      setIsInitialized(true);
      console.log('✅ [AUTH] Auth check completed, loading:', false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Starting login process for:', username);
      setLoading(true);
      
      const result = await secureLoginUser(username, password);
      
      if (result.success && result.user && result.token) {
        const loginTime = Date.now().toString();
        
        // Store auth data
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
        localStorage.setItem('auth_login_time', loginTime);
        
        console.log('✅ [AUTH] Login successful, data stored:', {
          username: result.user.username,
          role: result.user.role,
          department: result.user.department,
          loginTime: new Date(parseInt(loginTime)).toISOString(),
          tokenLength: result.token.length
        });
        
        const userWithToken: AuthenticatedStaff = { ...result.user, token: result.token };
        setUser(userWithToken);
        setSupabaseAuth(result.token, result.user.username);
        healthCheckService.onUserLogin();
        
        // Remove duplicate toast - only show in Login component
        // toast.success('Đăng nhập thành công!');
        return { success: true };
      } else {
        console.log('❌ [AUTH] Login failed:', result.error);
        return { success: false, error: result.error || 'Đăng nhập thất bại' };
      }
    } catch (error: any) {
      console.error('❌ [AUTH] Login error:', error);
      return { success: false, error: error.message || 'Lỗi hệ thống' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 [AUTH] Logging out user');
    clearSessionData();
    setUser(null);
    clearSupabaseAuth();
    healthCheckService.onUserLogout();
    toast.success('Đã đăng xuất');
  };

  // Initial auth check on mount
  useEffect(() => {
    console.log('🚀 [AUTH] AuthProvider mounted, starting initial auth check');
    checkAuth();
  }, []);

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(async () => {
      if (user) {
        console.log('⏰ [AUTH] Periodic session validation...');
        const validUser = await validateAndRestoreSession();
        
        if (!validUser) {
          console.log('⚠️ [AUTH] Session invalid during periodic check, logging out');
          logout();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          console.log('✅ [AUTH] Periodic validation passed');
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      console.log('🧹 [AUTH] Clearing periodic validation interval');
      clearInterval(interval);
    };
  }, [isInitialized, user]);

  // Handle page visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isInitialized && user) {
        console.log('👁️ [AUTH] Tab became visible, validating session...');
        const validUser = await validateAndRestoreSession();
        
        if (!validUser) {
          console.log('⚠️ [AUTH] Session invalid after tab focus, logging out');
          logout();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          console.log('✅ [AUTH] Session valid after tab focus');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSecureAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useSecureAuth;

export default AuthProvider;