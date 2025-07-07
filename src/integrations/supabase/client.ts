import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getStoredToken } from '@/utils/authUtils';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: async (url, options) => {
      const token = getStoredToken();
      const headers = new Headers(options?.headers);

      // Nếu có token (JWT) của người dùng, sử dụng nó để xác thực.
      // Điều này sẽ ghi đè lên khóa anon mặc định.
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return fetch(url, { ...options, headers });
    },
  },
});