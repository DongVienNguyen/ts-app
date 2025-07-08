import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AuthContextType, Staff, LoginResult } from '@/types/auth';
import { getStoredUser, storeUser, removeStoredUser, getStoredToken, storeToken, removeStoredToken } from '@/utils/authUtils';
import { secureLoginUser } from '@/services/secureAuthService';
import { setCurrentUserContext } from '@/utils/otherAssetUtils';
import { validateInput } from '@/utils/inputValidation';
import { logSecurityEvent } from '@/utils/secureAuthUtils';
import { supabase } from '@/integrations/supabase/client';

const SecureAuthContext = createContext<AuthContextType | undefined>(undefined);

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const storedUser = getStoredUser();

        if (session && storedUser) {
          setUser(storedUser);
          await setCurrentUserContext(storedUser)
            .catch(err => console.error("Failed to set user context on init:", err));
        } else if (!session) {
          removeStoredUser();
          removeStoredToken();
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        removeStoredUser();
        removeStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        removeStoredUser();
        removeStoredToken();
        localStorage.removeItem('loggedInStaff');
        localStorage.removeItem('currentUser');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const usernameValidation = validateInput.validateText(username, 30);
    if (!usernameValidation.isValid) {
      return { error: usernameValidation.error || 'Tên đăng nhập không hợp lệ' };
    }

    const passwordValidation = validateInput.validateText(password, 100);
    if (!passwordValidation.isValid) {
      return { error: 'Mật khẩu không hợp lệ' };
    }

    try {
      const { user: loggedInUser, token, error: loginError } = await secureLoginUser(username, password);

      if (loginError) {
        return { error: loginError };
      }

      if (loggedInUser && token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token,
        });

        if (sessionError) {
          logSecurityEvent('SESSION_SET_ERROR', { error: sessionError.message });
          return { error: 'Không thể thiết lập phiên đăng nhập.' };
        }

        storeUser(loggedInUser);
        storeToken(token);
        setUser(loggedInUser);
        await setCurrentUserContext(loggedInUser);
        
        localStorage.setItem('loggedInStaff', JSON.stringify(loggedInUser));
        localStorage.setItem('currentUser', JSON.stringify({
          username: loggedInUser.username,
          role: loggedInUser.role
        }));
        
        return { error: null };
      } else {
        return { error: 'Đăng nhập thất bại không xác định' };
      }
    } catch (error) {
      logSecurityEvent('LOGIN_EXCEPTION', { error: (error as Error).message });
      return { error: 'Đã xảy ra lỗi trong quá trình đăng nhập' };
    }
  }, []);

  const logout = useCallback(() => {
    logSecurityEvent('LOGOUT', { username: user?.username });
    
    supabase.auth.signOut().catch(err => {
      console.error("Error during sign out:", err);
    });
    
    window.location.href = '/login';
  }, [user]);

  return (
    <SecureAuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </SecureAuthContext.Provider>
  );
}

export function useSecureAuth() {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
}