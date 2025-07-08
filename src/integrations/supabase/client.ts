import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';
import { getStoredToken } from '@/utils/authUtils';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // We handle auth manually with custom tokens, so we disable Supabase's session persistence.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'asset-management-app',
      },
    },
    // This custom fetch function dynamically adds the Authorization header to every request.
    fetch: (input, init) => {
      const token = getStoredToken();
      const headers = new Headers(init?.headers);

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Forward the request with the updated headers.
      return fetch(input, { ...init, headers });
    },
  } as any // Cast to 'any' to bypass the incorrect TypeScript error for the 'fetch' property.
);

// This listener handles sign-out events across tabs.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing local storage.');
    localStorage.removeItem('secure_user');
    localStorage.removeItem('secure_token');
    localStorage.removeItem('loggedInStaff');
    localStorage.removeItem('currentUser');
    // Redirect to login page to ensure a clean state.
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
});