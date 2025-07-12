import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/types/auth';
import { secureLoginUser } from '@/services/secureAuthService';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { healthCheckService } from '@/services/healthCheckService';
import { toast } from 'sonner';

// Extend Staff type to include token (if needed for client-side logic, though Supabase manages it internally)
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

  // Use Supabase's onAuthStateChange to manage session
  useEffect(() => {
    console.log('🚀 [AUTH] AuthProvider mounted, setting up auth state listener');
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AUTH] Auth state changed:', event, session);
      if (session) {
        // Fetch user details from 'staff' table using the session's user ID
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (staffError) {
          console.error('❌ [AUTH] Error fetching staff data:', staffError);
          setUser(null);
          healthCheckService.onUserLogout();
        } else if (staffData) {
          const authenticatedUser: AuthenticatedStaff = {
            ...staffData,
            token: session.access_token, // Store access token if needed for direct API calls
            id: staffData.id, // Ensure ID is present
            username: staffData.username, // Ensure username is present
            role: staffData.role || 'user', // Default role
            account_status: staffData.account_status || 'active', // Default status
          };
          setUser(authenticatedUser);
          healthCheckService.onUserLogin();
        }
      } else {
        setUser(null);
        healthCheckService.onUserLogout();
      }
      setLoading(false);
    });

    // Initial session check
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ [AUTH] Error getting initial session:', error);
      }
      // onAuthStateChange will handle setting the user state
      setLoading(false);
    };

    getInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
      console.log('🧹 [AUTH] Auth state listener unsubscribed');
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Starting login process for:', username);
      setLoading(true);
      
      // Call the secureLoginUser service which uses Edge Function
      const result = await secureLoginUser(username, password);
      
      if (result.success && result.user && result.token) {
        // Supabase's onAuthStateChange will pick up the new session
        // after the Edge Function successfully authenticates and sets the cookie/session.
        toast.success("Đăng nhập thành công!", {
          id: 'login-success',
          duration: 3000
        });
        return { success: true };
      } else {
        console.log('❌ [AUTH] Login failed:', result.error);
        return { success: false, error: result.error || 'Đăng nhập thất bại' };
      }
    } catch (error: any) {
      console.error('❌ [AUTH] Login error:', error);
      return { success: false, error: error.message || 'Lỗi hệ thống' };
    } finally {
      // setLoading(false); // onAuthStateChange will handle loading state
    }
  };

  const logout = async () => {
    console.log('🚪 [AUTH] Logging out user');
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [AUTH] Error signing out:', error);
      toast.error('Lỗi khi đăng xuất');
    } else {
      toast.success('Đã đăng xuất');
    }
    // setLoading(false); // onAuthStateChange will handle loading state
  };

  const checkAuth = async () => {
    // This function is now primarily for re-triggering the auth state check if needed
    // The useEffect already sets up a listener and initial check
    console.log('🔄 [AUTH] Manual checkAuth triggered. Listener will handle updates.');
    setLoading(true);
    await supabase.auth.getSession(); // Force a session refresh
    // setLoading(false); // onAuthStateChange will handle loading state
  };

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