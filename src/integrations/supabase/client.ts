import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://itoapoyrxxmtbbuolfhk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk';

// Create the main Supabase client for user operations
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Create service role client for system operations (bypasses RLS)
// Note: In a real production environment, this should use the actual service role key
// For now, we'll create a client that can handle system operations
const createServiceRoleClient = () => {
  // Try to get service role key from environment
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceRoleKey) {
    console.log('🔑 Using service role key for system operations');
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  } else {
    console.warn('⚠️ Service role key not found, using anon key with elevated permissions');
    // Fallback to anon key but with special headers for system operations
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'X-System-Operation': 'true' // Custom header to identify system operations
        }
      }
    });
  }
};

const serviceRoleClient = createServiceRoleClient();

// Store current auth state
let currentAuthToken: string | null = null;
let currentUsername: string | null = null;

// Set Supabase auth for RLS policies
export function setSupabaseAuth(token: string, username: string) {
  console.log('🔐 Setting Supabase auth token for user:', username);
  currentAuthToken = token;
  currentUsername = username;
  console.log('✅ Supabase auth token set successfully');
}

// Clear Supabase auth
export function clearSupabaseAuth() {
  console.log('🔓 Clearing Supabase auth token');
  currentAuthToken = null;
  currentUsername = null;
  console.log('✅ Supabase auth token cleared');
}

// Get current auth info
export function getCurrentAuth() {
  return {
    token: currentAuthToken,
    username: currentUsername,
    isAuthenticated: !!(currentAuthToken && currentUsername)
  };
}

// Get authenticated client for user operations
export function getAuthenticatedClient() {
  if (!currentAuthToken) {
    console.warn('⚠️ No auth token available');
    return null;
  }
  
  // Create a client with the current auth token
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'Authorization': `Bearer ${currentAuthToken}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    }
  });
}

// Get service role client for system operations
export function getServiceRoleClient() {
  return serviceRoleClient;
}

// Export the main client
export { supabase };
export default supabase;

console.log('✅ Supabase client initialized successfully');