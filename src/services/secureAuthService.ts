import { supabase } from '@/integrations/supabase/client';
import { Staff, LoginResponse } from '@/types/auth';
import { logSecurityEvent } from '@/utils/secureAuthUtils';

export async function secureLoginUser(username: string, password: string): Promise<LoginResponse> {
  try {
    logSecurityEvent('LOGIN_ATTEMPT', { username });

    // Call the login edge function
    const { data, error } = await supabase.functions.invoke('login-user', {
      body: { username, password }
    });

    if (error) {
      logSecurityEvent('LOGIN_ERROR', { username, error: error.message });
      return { success: false, error: 'Lỗi kết nối đến server' };
    }

    if (data.success && data.user && data.token) {
      logSecurityEvent('LOGIN_SUCCESS', { username });
      return {
        success: true,
        user: data.user as Staff,
        token: data.token
      };
    } else {
      logSecurityEvent('LOGIN_FAILED', { username, reason: data.error });
      return {
        success: false,
        error: data.error || 'Đăng nhập thất bại'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    logSecurityEvent('LOGIN_EXCEPTION', { username, error: error instanceof Error ? error.message : 'Unknown error' });
    return {
      success: false,
      error: 'Đã xảy ra lỗi trong quá trình đăng nhập'
    };
  }
}

export async function checkAccountStatus(username: string): Promise<{ isLocked: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('check-account-status', {
      body: { username }
    });

    if (error) {
      return { isLocked: false, error: error.message };
    }

    return { isLocked: data.isLocked || false };
  } catch (error) {
    console.error('Account status check error:', error);
    return { isLocked: false, error: 'Lỗi kiểm tra trạng thái tài khoản' };
  }
}

export async function resetPassword(username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    logSecurityEvent('PASSWORD_RESET_ATTEMPT', { username });

    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: { username, currentPassword, newPassword }
    });

    if (error) {
      logSecurityEvent('PASSWORD_RESET_ERROR', { username, error: error.message });
      return { success: false, error: 'Lỗi kết nối đến server' };
    }

    if (data.success) {
      logSecurityEvent('PASSWORD_RESET_SUCCESS', { username });
      return { success: true };
    } else {
      logSecurityEvent('PASSWORD_RESET_FAILED', { username, reason: data.error });
      return { success: false, error: data.error || 'Đổi mật khẩu thất bại' };
    }
  } catch (error) {
    console.error('Password reset error:', error);
    logSecurityEvent('PASSWORD_RESET_EXCEPTION', { username, error: error instanceof Error ? error.message : 'Unknown error' });
    return { success: false, error: 'Đã xảy ra lỗi trong quá trình đổi mật khẩu' };
  }
}