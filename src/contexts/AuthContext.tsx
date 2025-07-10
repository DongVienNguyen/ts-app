import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser, validateSession } from '@/services/secureAuthService';
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

// Create complete auth service using the exported functions
const secureAuthService = {
  async login(username: string, password: string) {
    return await secureLoginUser(username, password);
  },
  
  async getCurrentUser(): Promise<AuthenticatedStaff | null> {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      const loginTime = localStorage.getItem('auth_login_time');
      
      if (!token || !userStr || !loginTime) {
        console.log('Missing auth data in localStorage');
        return null;
      }

      // Check if session is older than 7 days
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const loginTimestamp = parseInt(loginTime);
      const now = Date.now();
      
      if (now - loginTimestamp > sevenDaysInMs) {
        console.log('Session expired (older than 7 days)');
        this.logout();
        return null;
      }

      // Basic token validation
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.log('Invalid token format');
          this.logout();
          return null;
        }

        // Check token expiration
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.log('Token expired');
          this.logout();
          return null;
        }
      } catch (tokenError) {
        console.log('Token validation error:', tokenError);
        this.logout();
        return null;
      }
      
      const user = JSON.parse(userStr) as Staff;
      console.log('Successfully restored user session:', user.username);
      return { ...user, token };
    } catch (error) {
      console.error('Error getting current user:', error);
      this.logout();
      return null;
    }
  },
  
  logout() {
    console.log('Logging out user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_login_time');
    // Clear legacy storage keys
    localStorage.removeItem('secure_user');
    localStorage.removeItem('secure_token');
    localStorage.removeItem('loggedInStaff');
    localStorage.removeItem('currentUser');
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedStaff | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const currentUser = await secureAuthService.getCurrentUser();
      if (currentUser) {
        console.log('User authenticated:', currentUser.username);
        setUser(currentUser);
        // Set Supabase auth for RLS policies
        setSupabaseAuth(currentUser.token || '', currentUser.username);
        // Start health monitoring
        healthCheckService.onUserLogin();
      } else {
        console.log('No authenticated user found');
        setUser(null);
        clearSupabaseAuth();
        healthCheckService.onUserLogout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      clearSupabaseAuth();
      healthCheckService.onUserLogout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const result = await secureAuthService.login(username, password);
      
      if (result.success && result.user && result.token) {
        // Store auth data with login timestamp
        const loginTime = Date.now().toString();
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
        localStorage.setItem('auth_login_time', loginTime);
        
        console.log('Login successful, storing user data:', result.user.username);
        
        const userWithToken: AuthenticatedStaff = { ...result.user, token: result.token };
        setUser(userWithToken);
        setSupabaseAuth(result.token, result.user.username);
        healthCheckService.onUserLogin();
        toast.success('Đăng nhập thành công!');
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Đăng nhập thất bại' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Lỗi hệ thống' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Manual logout triggered');
    secureAuthService.logout();
    setUser(null);
    clearSupabaseAuth();
    healthCheckService.onUserLogout();
    toast.success('Đã đăng xuất');
  };

  // Check session expiration every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        const token = localStorage.getItem('auth_token');
        const loginTime = localStorage.getItem('auth_login_time');
        
        if (!token || !loginTime) {
          console.log('Session data missing, logging out');
          logout();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }

        // Check 7-day expiration
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const loginTimestamp = parseInt(loginTime);
        const now = Date.now();
        
        if (now - loginTimestamp > sevenDaysInMs) {
          console.log('Session expired (7 days), logging out');
          logout();
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }

        // Check token expiration
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && payload.exp < Date.now() / 1000) {
              console.log('Token expired, logging out');
              logout();
              toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }
          }
        } catch (error) {
          console.log('Token validation error during interval check:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Initial auth check on mount
  useEffect(() => {
    console.log('AuthProvider mounted, checking initial auth state');
    checkAuth();
  }, []);

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

// Primary hook - use this consistently
export const useSecureAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within an AuthProvider');
  }
  return context;
};

// Alias for backward compatibility - both point to same context
export const useAuth = useSecureAuth;

export default AuthProvider;