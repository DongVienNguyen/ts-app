import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk'

// Create the Supabase client with proper auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle our own session management
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
})

// Store current auth token and username for logging
let currentAuthToken: string | null = null;
let currentUsername: string | null = null;

// Function to set the auth token for RLS policies
export const setSupabaseAuth = (token: string, username: string) => {
  console.log('🔐 Setting Supabase auth token for user:', username);
  
  // Store the token and username
  currentAuthToken = token;
  currentUsername = username;
  
  // Set the session using the proper Supabase auth method
  supabase.auth.setSession({
    access_token: token,
    refresh_token: token
  });
  
  // Also set for realtime if needed
  if (supabase.realtime) {
    supabase.realtime.setAuth(token);
  }
  
  console.log('✅ Supabase auth token set successfully');
};

// Function to clear the auth token
export const clearSupabaseAuth = () => {
  console.log('🔓 Clearing Supabase auth token');
  
  // Clear stored token and username
  currentAuthToken = null;
  currentUsername = null;
  
  // Sign out to clear session
  supabase.auth.signOut();
  
  // Clear realtime auth
  if (supabase.realtime) {
    supabase.realtime.setAuth(null);
  }
  
  console.log('✅ Supabase auth token cleared');
};

// Function to get current auth status
export const getSupabaseAuthStatus = () => {
  const hasAuth = !!(currentAuthToken && currentUsername);
  console.log('🔍 Supabase auth status:', hasAuth ? `Authenticated as ${currentUsername}` : 'Not authenticated');
  return hasAuth;
};

// Function to get authenticated client for system operations
export const getAuthenticatedSupabaseClient = () => {
  if (!currentAuthToken) {
    console.warn('⚠️ No auth token available for system operations');
    return supabase; // Return regular client as fallback
  }
  
  // Create a new client instance with the current auth token
  const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAuthToken}`,
        'apikey': supabaseAnonKey
      }
    }
  });
  
  return authenticatedClient;
};

console.log('✅ Supabase client initialized successfully');

export default supabase;