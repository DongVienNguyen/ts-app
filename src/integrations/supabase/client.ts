import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config';
import { getStoredToken } from '@/utils/authUtils'; // Import getStoredToken

// Get the stored token during client initialization
const storedToken = getStoredToken();

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
        'x-application-name': 'asset-management-app',
        // Conditionally add Authorization header if a token exists
        ...(storedToken && { 'Authorization': `Bearer ${storedToken}` })
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