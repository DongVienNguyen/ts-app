import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';
import { getStoredToken } from '@/utils/authUtils';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Chúng ta xử lý xác thực thủ công với token tùy chỉnh, vì vậy hãy tắt tính năng lưu session của Supabase.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'asset-management-app',
      },
      // Hàm fetch tùy chỉnh này sẽ tự động thêm header Authorization vào mỗi yêu cầu.
      fetch: (input, init) => {
        const token = getStoredToken();
        const headers = new Headers(init?.headers);

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        // Chuyển tiếp yêu cầu với các header đã được cập nhật.
        return fetch(input, { ...init, headers });
      },
    },
  }
);

// Listener này xử lý sự kiện đăng xuất trên các tab khác nhau.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing local storage.');
    localStorage.removeItem('secure_user');
    localStorage.removeItem('secure_token');
    localStorage.removeItem('loggedInStaff');
    localStorage.removeItem('currentUser');
    // Chuyển hướng đến trang đăng nhập để đảm bảo trạng thái sạch.
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
});