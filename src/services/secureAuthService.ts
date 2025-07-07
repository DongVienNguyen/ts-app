import { Staff } from '@/types/auth';
import { logSecurityEvent } from '@/utils/secureAuthUtils';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';

interface SecureLoginResult {
  user: Staff | null;
  token: string | null;
  error: string | null;
}

async function invokeEdgeFunction(functionName: string, body: object): Promise<{ data: any, error: any }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Edge function ${functionName} returned status ${response.status}: ${errorBody}`);
      return { data: null, error: `Edge Function returned a non-2xx status code: ${response.status}` };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

export async function secureLoginUser(username: string, password: string): Promise<SecureLoginResult> {
  try {
    const { data, error } = await invokeEdgeFunction('login-user', { username, password });

    if (error) {
      logSecurityEvent('LOGIN_FUNCTION_INVOKE_ERROR', { error });
      return { user: null, token: null, error: 'Lỗi khi gọi hàm đăng nhập' };
    }

    if (data.error) {
      logSecurityEvent('LOGIN_FUNCTION_LOGIC_ERROR', { username, error: data.error });
      return { user: null, token: null, error: data.error };
    }
    
    if (!data.user || !data.token) {
      logSecurityEvent('LOGIN_INVALID_RESPONSE', { username });
      return { user: null, token: null, error: 'Phản hồi đăng nhập không hợp lệ từ máy chủ.' };
    }

    return { user: data.user, token: data.token, error: null };
  } catch (error) {
    logSecurityEvent('LOGIN_EXCEPTION', { error: (error as Error).message });
    return { user: null, token: null, error: 'Đã xảy ra lỗi không mong muốn trong quá trình đăng nhập.' };
  }
}

interface AccountStatusResult {
  isLocked: boolean;
  error: string | null;
}

export async function checkAccountStatus(username: string): Promise<AccountStatusResult> {
  try {
    const { data, error } = await invokeEdgeFunction('check-account-status', { username });

    if (error) {
      logSecurityEvent('CHECK_ACCOUNT_STATUS_INVOKE_ERROR', { username, error });
      return { isLocked: false, error: 'Lỗi khi kiểm tra trạng thái tài khoản' };
    }

    if (data.error) {
      logSecurityEvent('CHECK_ACCOUNT_STATUS_LOGIC_ERROR', { username, error: data.error });
      return { isLocked: false, error: data.error };
    }

    return { isLocked: data.isLocked, error: null };
  } catch (error) {
    logSecurityEvent('CHECK_ACCOUNT_STATUS_EXCEPTION', { username, error: (error as Error).message });
    return { isLocked: false, error: 'Đã xảy ra lỗi không mong muốn khi kiểm tra trạng thái tài khoản.' };
  }
}