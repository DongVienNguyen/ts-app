import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser } from '@/services/secureAuthService';
import { getStoredUser, storeUser, removeStoredUser, storeToken, removeStoredToken } from '@/utils/authUtils';
import { toast } from 'sonner';

interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface SecureAuthProviderProps {
  children: ReactNode;
}

async function getCurrentUser(): Promise<Staff | null> {
  return getStoredUser();
}

async function loginUser(username: string, password: string) {
  const result = await secureLoginUser(username, password);
  if (result.user && result.token && !result.error) {
    storeUser(result.user);
    storeToken(result.token);
    return { success: true, user: result.user };
  }
  return { success: false, error: result.error };
}

async function logoutUser() {
  removeStoredUser();
  removeStoredToken();
}

export function SecureAuthProvider({ children }: SecureAuthProviderProps) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to get current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const result = await loginUser(username, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Đăng nhập thất bại' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Đã xảy ra lỗi trong quá trình đăng nhập' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      toast.success('Đăng xuất thành công');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Lỗi khi đăng xuất');
    }
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

export function useSecureAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
}

// Export the context for compatibility
export const SecureAuthContext = AuthContext;