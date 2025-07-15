import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser, validateSession } from '@/services/secureAuthService';
import { toast } from 'sonner';
import { updateSupabaseAuthToken } from '@/integrations/supabase/client';
import { subscribeUserToPush, hasActivePushSubscription, checkPushNotificationSupport } from '@/utils/pushNotificationUtils';

export interface AuthenticatedStaff extends Staff {
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

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (validateSession() && token) {
          const userStr = localStorage.getItem('auth_user');
          const storedUser: AuthenticatedStaff = JSON.parse(userStr!);
          await updateSupabaseAuthToken(token);
          setUser(storedUser);
        } else {
          await updateSupabaseAuthToken(null);
          localStorage.clear();
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [AUTH] Error restoring session, clearing session.', error);
        await updateSupabaseAuthToken(null);
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Auto-subscribe to push notifications if permission is already granted
  useEffect(() => {
    const autoSubscribe = async () => {
      if (user && user.username) {
        console.log('[Push Auto-Sub] Checking conditions for user:', user.username);
        const { supported } = checkPushNotificationSupport();
        if (!supported) {
          console.log('[Push Auto-Sub] Not supported.');
          return;
        }

        if (Notification.permission === 'granted') {
          console.log('[Push Auto-Sub] Permission is granted.');
          const isAlreadySubscribed = await hasActivePushSubscription(user.username);
          console.log(`[Push Auto-Sub] Already subscribed in DB: ${isAlreadySubscribed}`);
          if (!isAlreadySubscribed) {
            console.log('[Push Auto-Sub] Not subscribed in DB. Attempting silent subscription...');
            toast.info('Đang tự động thiết lập thông báo đẩy...');
            const success = await subscribeUserToPush(user.username);
            if (success) {
              toast.success('🔔 Thiết lập thông báo đẩy thành công!');
              console.log('[Push Auto-Sub] Silent subscription successful.');
            } else {
              toast.error('Lỗi khi tự động thiết lập thông báo đẩy.', {
                description: 'Vui lòng thử lại từ trang cài đặt hoặc thanh điều hướng.'
              });
              console.error('[Push Auto-Sub] Silent subscription failed.');
            }
            // Dispatch event regardless of success to trigger UI refresh
            window.dispatchEvent(new CustomEvent('push-subscription-changed'));
          }
        } else {
          console.log(`[Push Auto-Sub] Permission is not 'granted' (it's '${Notification.permission}'). Skipping.`);
        }
      }
    };

    // Run after a short delay to ensure everything is settled
    const timer = setTimeout(autoSubscribe, 2500);
    return () => clearTimeout(timer);
  }, [user]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await secureLoginUser(username, password);
      if (result.success && result.user && result.token) {
        const authenticatedUser: AuthenticatedStaff = { ...result.user, token: result.token };
        await updateSupabaseAuthToken(result.token);
        localStorage.setItem('auth_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_login_time', Date.now().toString());
        setUser(authenticatedUser);
        toast.success("Đăng nhập thành công!", { id: 'login-success', duration: 3000 });
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Đăng nhập thất bại' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi hệ thống' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await updateSupabaseAuthToken(null);
    localStorage.clear();
    setUser(null);
    toast.success('Đã đăng xuất');
    setLoading(false);
  };

  const checkAuth = async () => {
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
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