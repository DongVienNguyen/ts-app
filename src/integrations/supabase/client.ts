import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';

// Create a single instance of the Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-application-name': 'asset-management-app'
      }
    }
  }
);

// Add a listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Supabase auth event: ${event}`);
  
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    localStorage.removeItem('secure_user');
    localStorage.removeItem('secure_token');
    localStorage.removeItem('loggedInStaff');
    localStorage.removeItem('currentUser');
  }
});