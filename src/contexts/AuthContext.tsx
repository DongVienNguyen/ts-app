import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser, validateSession } from '@/services/secureAuthService';
import { toast } from 'sonner';
import { updateSupabaseAuthToken } from '@/integrations/supabase/client';

export interface AuthenticatedStaff extends Staff { // Added export keyword
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
  const [loading, setLoading] = useState(true); // Start with loading true

  useEffect(() => {
    const restoreSession = async () => {
      console.log('🚀 [AUTH] AuthProvider mounted, checking for existing session');
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (validateSession() && token) {
          const userStr = localStorage.getItem('auth_user');
          const storedUser: AuthenticatedStaff = JSON.parse(userStr!);
          
          await updateSupabaseAuthToken(token);

          setUser(storedUser);
          console.log('✅ [AUTH] Session restored for user:', storedUser.username);
        } else {
          console.log('🔎 [AUTH] No valid session found. Clearing session.');
          await updateSupabaseAuthToken(null);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_login_time');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [AUTH] Error restoring session, clearing session.', error);
        await updateSupabaseAuthToken(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_login_time');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    console.log('🔐 [AUTH] Starting login process for:', username);
    setLoading(true);
    try {
      const result = await secureLoginUser(username, password);
      
      if (result.success && result.user && result.token) {
        const authenticatedUser: AuthenticatedStaff = { ...result.user, token: result.token };
        
        console.log('[AUTH] Login API success. Token received. Updating Supabase client...');
        await updateSupabaseAuthToken(result.token);
        console.log('[AUTH] Supabase client update awaited and completed. Now setting user state.');

        localStorage.setItem('auth_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_login_time', Date.now().toString());
        
        setUser(authenticatedUser);
        
        toast.success("Đăng nhập thành công!", { id: 'login-success', duration: 3000 });
        
        console.log('✅ [AUTH] Set user state and finished login process for:', authenticatedUser.username);
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
    
    await updateSupabaseAuthToken(null);
    
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_login_time');
    
    setUser(null);
    
    toast.success('Đã đăng xuất');
    setLoading(false);
  };

  const checkAuth = async () => {
    console.log('🔄 [AUTH] Manual checkAuth triggered.');
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (validateSession() && token) {
        await updateSupabaseAuthToken(token);
        const userStr = localStorage.getItem('auth_user');
        setUser(JSON.parse(userStr!));
      } else {
        await updateSupabaseAuthToken(null);
        setUser(null);
      }
    } catch (e) {
      await updateSupabaseAuthToken(null);
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