import { supabase } from '@/integrations/supabase/client';
import { LoginResponse, Staff } from '@/types/auth';
import { sanitizeInput, isValidUsername, rateLimit, logSecurityEvent } from '@/utils/secureAuthUtils';

export async function secureLoginUser(username: string, password: string): Promise<LoginResponse> {
  try {
    // Input validation and sanitization
    const cleanUsername = sanitizeInput(username);
    
    if (!isValidUsername(cleanUsername)) {
      logSecurityEvent('INVALID_USERNAME_FORMAT', { username: cleanUsername });
      return { success: false, error: 'Tên đăng nhập không hợp lệ' };
    }

    if (!password || password.length < 6) {
      logSecurityEvent('INVALID_PASSWORD_FORMAT', { username: cleanUsername });
      return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }

    // Rate limiting
    if (!rateLimit(`login_${cleanUsername}`, 5, 300000)) { // 5 attempts per 5 minutes
      return { success: false, error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 5 phút.' };
    }

    // Call the login edge function
    const { data, error } = await supabase.functions.invoke('login-user', {
      body: {
        username: cleanUsername,
        password: password
      }
    });

    if (error) {
      logSecurityEvent('LOGIN_FUNCTION_ERROR', { 
        username: cleanUsername, 
        error: error.message 
      });
      return { success: false, error: 'Lỗi hệ thống. Vui lòng thử lại sau.' };
    }

    if (data.success && data.user && data.token) {
      // Clear rate limiting on successful login
      localStorage.removeItem(`rate_limit_login_${cleanUsername}`);
      
      logSecurityEvent('LOGIN_SUCCESS', { username: cleanUsername });
      
      return {
        success: true,
        user: data.user as Staff,
        token: data.token
      };
    } else {
      logSecurityEvent('LOGIN_FAILED', { 
        username: cleanUsername, 
        error: data.error 
      });
      
      return { 
        success: false, 
        error: data.error || 'Đăng nhập thất bại' 
      };
    }
  } catch (error) {
    console.error('Secure login error:', error);
    logSecurityEvent('LOGIN_EXCEPTION', { 
      username: sanitizeInput(username), 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return { 
      success: false, 
      error: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.' 
    };
  }
}

export async function checkAccountStatus(username: string): Promise<{
  isLocked: boolean;
  failedAttempts: number;
  canRetryAt?: Date;
  error?: string;
}> {
  try {
    const cleanUsername = sanitizeInput(username);
    
    // Check account status directly from database
    const { data, error } = await supabase
      .from('staff')
      .select('account_status, failed_login_attempts, locked_at, last_failed_login')
      .eq('username', cleanUsername)
      .single();

    if (error) {
      console.error('Error checking account status:', error);
      return { isLocked: false, failedAttempts: 0, error: error.message };
    }

    if (!data) {
      return { isLocked: false, failedAttempts: 0, error: 'User not found' };
    }

    const isLocked = data.account_status === 'locked';
    const failedAttempts = data.failed_login_attempts || 0;
    let canRetryAt: Date | undefined;

    if (isLocked && data.locked_at) {
      // Account can be retried after 24 hours
      canRetryAt = new Date(new Date(data.locked_at).getTime() + 24 * 60 * 60 * 1000);
    }

    return {
      isLocked,
      failedAttempts,
      canRetryAt
    };
  } catch (error) {
    console.error('Account status check error:', error);
    return { isLocked: false, failedAttempts: 0, error: 'Network error' };
  }
}

export async function resetPassword(
  username: string, 
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUsername = sanitizeInput(username);
    
    // Validate inputs
    if (!isValidUsername(cleanUsername)) {
      return { success: false, error: 'Tên đăng nhập không hợp lệ' };
    }

    if (!currentPassword || currentPassword.length < 6) {
      return { success: false, error: 'Mật khẩu hiện tại không hợp lệ' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: 'Mật khẩu mới phải khác mật khẩu hiện tại' };
    }

    // Rate limiting for password reset
    if (!rateLimit(`reset_${cleanUsername}`, 3, 600000)) { // 3 attempts per 10 minutes
      return { success: false, error: 'Quá nhiều lần thử đổi mật khẩu. Vui lòng thử lại sau 10 phút.' };
    }

    // Call the reset-password edge function
    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: {
        username: cleanUsername,
        currentPassword: currentPassword,
        newPassword: newPassword
      }
    });

    if (error) {
      logSecurityEvent('PASSWORD_RESET_FUNCTION_ERROR', { 
        username: cleanUsername, 
        error: error.message 
      });
      return { success: false, error: 'Lỗi hệ thống. Vui lòng thử lại sau.' };
    }

    if (data.success) {
      logSecurityEvent('PASSWORD_RESET_SUCCESS', { username: cleanUsername });
      
      // Clear rate limiting on successful reset
      localStorage.removeItem(`rate_limit_reset_${cleanUsername}`);
      
      return { success: true };
    } else {
      logSecurityEvent('PASSWORD_RESET_FAILED', { 
        username: cleanUsername, 
        error: data.error 
      });
      
      return { 
        success: false, 
        error: data.error || 'Đổi mật khẩu thất bại' 
      };
    }
  } catch (error) {
    console.error('Password reset error:', error);
    logSecurityEvent('PASSWORD_RESET_EXCEPTION', { 
      username: sanitizeInput(username), 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return { 
      success: false, 
      error: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.' 
    };
  }
}

export async function unlockAccount(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanUsername = sanitizeInput(username);
    
    if (!isValidUsername(cleanUsername)) {
      return { success: false, error: 'Tên đăng nhập không hợp lệ' };
    }

    const { error } = await supabase
      .from('staff')
      .update({ 
        account_status: 'active',
        failed_login_attempts: 0,
        last_failed_login: null,
        locked_at: null
      })
      .eq('username', cleanUsername);

    if (error) {
      logSecurityEvent('ACCOUNT_UNLOCK_ERROR', { 
        username: cleanUsername, 
        error: error.message 
      });
      return { success: false, error: 'Lỗi mở khóa tài khoản' };
    }

    logSecurityEvent('ACCOUNT_UNLOCKED', { username: cleanUsername });
    
    // Clear rate limiting
    localStorage.removeItem(`rate_limit_login_${cleanUsername}`);
    
    return { success: true };
  } catch (error) {
    console.error('Account unlock error:', error);
    return { success: false, error: 'Đã xảy ra lỗi không mong muốn' };
  }
}

export function validateSession(): boolean {
  try {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    const loginTime = localStorage.getItem('auth_login_time');
    
    if (!token || !user || !loginTime) {
      console.log('Session validation failed: missing data');
      return false;
    }

    // Check if session is older than 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const loginTimestamp = parseInt(loginTime);
    const now = Date.now();
    
    if (isNaN(loginTimestamp)) {
      console.log('Session validation failed: invalid login timestamp');
      return false;
    }
    
    if (now - loginTimestamp > sevenDaysInMs) {
      console.log('Session validation failed: session older than 7 days');
      logSecurityEvent('SESSION_EXPIRED', { 
        loginTime: new Date(loginTimestamp).toISOString(),
        expiredAt: new Date(now).toISOString()
      });
      return false;
    }

    // Validate token format - our token is base64 encoded JSON, not JWT
    try {
      const payload = JSON.parse(atob(token));
      
      // Check token expiration if present
      if (payload.exp && payload.exp < Date.now()) {
        console.log('Session validation failed: token expired');
        logSecurityEvent('TOKEN_EXPIRED', { exp: payload.exp });
        return false;
      }
    } catch (tokenError) {
      console.log('Session validation failed: token parsing error', tokenError);
      logSecurityEvent('TOKEN_PARSING_ERROR', { 
        error: tokenError instanceof Error ? tokenError.message : 'Unknown error' 
      });
      return false;
    }

    console.log('Session validation successful');
    return true;
  } catch (error) {
    console.log('Session validation failed: exception', error);
    logSecurityEvent('SESSION_VALIDATION_ERROR', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  }
}