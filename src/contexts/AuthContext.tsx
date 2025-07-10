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
      // First validate the session
      if (!validateSession()) {
        this.logout();
        return null;
      }

      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (!token || !userStr) {
        return null;
      }
      
      const user = JSON.parse(userStr) as Staff;
      return { ...user, token }; // Now TypeScript knows token is allowed
    } catch (error) {
      console.error('Error getting current user:', error);
      this.logout();
      return null;
    }
  },
  
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedStaff | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const currentUser = await secureAuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Set Supabase auth for RLS policies
        setSupabaseAuth(currentUser.token || '', currentUser.username);
        // Start health monitoring
        healthCheckService.onUserLogin();
      } else {
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
        // Store auth data
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
        
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
    secureAuthService.logout();
    setUser(null);
    clearSupabaseAuth();
    healthCheckService.onUserLogout();
    toast.success('Đã đăng xuất');
  };

  useEffect(() => {
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