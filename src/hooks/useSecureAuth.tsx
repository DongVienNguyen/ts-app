import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AuthContextType, Staff, LoginResult } from '@/types/auth';
import { getStoredUser, storeUser, removeStoredUser, getStoredToken, storeToken } from '@/utils/authUtils';
import { secureLoginUser } from '@/services/secureAuthService';
import { setCurrentUserContext } from '@/utils/otherAssetUtils';
import { validateInput } from '@/utils/inputValidation';
import { logSecurityEvent } from '@/utils/secureAuthUtils';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js'; // Thêm import này

const SecureAuthContext = createContext<AuthContextType | undefined>(undefined);

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getStoredUser();
        const storedToken = getStoredToken();
        
        if (storedUser && storedToken) {
          if (storedUser.username && storedUser.role) {
            setUser(storedUser);
            // NOTE: setAccessToken is deprecated. setSession requires a refresh_token and a Supabase User object.
            // This is a temporary fix for compile errors. Ideally, secureLoginUser should provide a refresh_token
            // and a Supabase User object, or the auth flow should be re-evaluated.
            await supabase.auth.setSession({
              access_token: storedToken,
              refresh_token: 'dummy_refresh_token', // Placeholder for type compatibility
              expires_in: 3600, // Placeholder
              token_type: 'bearer', // Placeholder
              user: { // Minimal user object to satisfy AuthSession type
                id: storedUser.id || 'unknown-id',
                email: storedUser.username || 'unknown@example.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                role: storedUser.role || 'authenticated'
              }
            } as Session); // Ép kiểu thành Session
            setCurrentUserContext(storedUser).catch(err => console.error("Failed to set user context on init:", err));
          } else {
            removeStoredUser(); // This will also remove the token
            logSecurityEvent('INVALID_STORED_USER_DATA');
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        removeStoredUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
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
        await setCurrentUserContext(loggedInUser);
        setUser(loggedInUser);
        storeUser(loggedInUser);
        storeToken(token);
        // NOTE: setAccessToken is deprecated. setSession requires a refresh_token and a Supabase User object.
        // This is a temporary fix for compile errors. Ideally, secureLoginUser should provide a refresh_token
        // and a Supabase User object, or the auth flow should be re-evaluated.
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: 'dummy_refresh_token', // Placeholder for type compatibility
          expires_in: 3600, // Placeholder
          token_type: 'bearer', // Placeholder
          user: { // Minimal user object to satisfy AuthSession type
            id: loggedInUser.id || 'unknown-id',
            email: loggedInUser.username || 'unknown@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            role: loggedInUser.role || 'authenticated'
          }
        } as Session); // Ép kiểu thành Session
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
    setUser(null);
    removeStoredUser(); // This also removes the token
    supabase.auth.signOut(); // Sign out from Supabase client
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