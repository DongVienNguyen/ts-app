import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser, validateSession } from '@/services/secureAuthService';
import { healthCheckService } from '@/services/healthCheckService';
import { toast } from 'sonner';

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

  // Manual session management using localStorage
  useEffect(() => {
    console.log('🚀 [AUTH] AuthProvider mounted, checking for existing session in localStorage');
    setLoading(true);
    try {
      if (validateSession()) {
        const userStr = localStorage.getItem('auth_user');
        const storedUser: AuthenticatedStaff = JSON.parse(userStr!);
        setUser(storedUser);
        healthCheckService.onUserLogin();
        console.log('✅ [AUTH] Session restored from localStorage for user:', storedUser.username);
      } else {
        console.log('🔎 [AUTH] No valid session found in localStorage. Clearing session.');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_login_time');
        setUser(null);
        healthCheckService.onUserLogout();
      }
    } catch (error) {
      console.error('❌ [AUTH] Error reading auth from storage, clearing session.', error);
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_login_time');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    console.log('🔐 [AUTH] Starting login process for:', username);
    setLoading(true);
    try {
      const result = await secureLoginUser(username, password);
      
      if (result.success && result.user && result.token) {
        const authenticatedUser: AuthenticatedStaff = { ...result.user, token: result.token };
        
        localStorage.setItem('auth_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_login_time', Date.now().toString());
        
        setUser(authenticatedUser);
        healthCheckService.onUserLogin();
        
        toast.success("Đăng nhập thành công!", { id: 'login-success', duration: 3000 });
        
        console.log('✅ [AUTH] Login successful, session saved for user:', authenticatedUser.username);
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

  const logout = async () => {
    console.log('🚪 [AUTH] Logging out user');
    setLoading(true);
    
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_login_time');
    
    setUser(null);
    healthCheckService.onUserLogout();
    
    toast.success('Đã đăng xuất');
    setLoading(false);
  };

  const checkAuth = async () => {
    // This function can now re-run the logic from useEffect
    console.log('🔄 [AUTH] Manual checkAuth triggered.');
    setLoading(true);
    try {
      if (validateSession()) {
        const userStr = localStorage.getItem('auth_user');
        setUser(JSON.parse(userStr!));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = { user, loading, login, logout, checkAuth };

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