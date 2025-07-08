import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getStoredToken } from '@/utils/authUtils';

// Thêm các dòng log này để kiểm tra giá trị biến môi trường
console.log('Debugging Supabase Client Init:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'asset-management-app',
      },
      fetch: (input, init) => {
        const token = getStoredToken();
        const headers = new Headers(init?.headers);

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(input, { ...init, headers });
      },
    },
  }
);

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing local storage.');
    localStorage.removeItem('secure_user');
    localStorage.removeItem('secure_token');
    localStorage.removeItem('loggedInStaff');
    localStorage.removeItem('currentUser');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
});