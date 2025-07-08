import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser } from '@/services/secureAuthService';
import { logSecurityEvent } from '@/utils/secureAuthUtils';
import { setSupabaseAuth, clearSupabaseAuth } from '@/integrations/supabase/client';

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
    // Check for existing session on app start
    const checkExistingSession = () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Set Supabase auth for RLS policies
          setSupabaseAuth(storedToken, userData.username);
          
          logSecurityEvent('SESSION_RESTORED', { username: userData.username });
          console.log('🔐 Session restored for user:', userData.username);
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        // Clear invalid session data
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        clearSupabaseAuth();
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const result = await secureLoginUser(username, password);
      
      if (result.success && result.user && result.token) {
        setUser(result.user);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
        localStorage.setItem('auth_token', result.token);
        
        // Set Supabase auth for RLS policies
        setSupabaseAuth(result.token, result.user.username);
        
        logSecurityEvent('LOGIN_SUCCESS', { username });
        console.log('🔐 User logged in and Supabase auth set:', username);
        
        return { success: true };
      } else {
        logSecurityEvent('LOGIN_FAILED', { username, error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      logSecurityEvent('LOGIN_ERROR', { username, error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, error: 'Đã xảy ra lỗi trong quá trình đăng nhập' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (user) {
      logSecurityEvent('LOGOUT', { username: user.username });
      console.log('🔓 User logging out:', user.username);
    }
    
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    
    // Clear Supabase auth
    clearSupabaseAuth();
    
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