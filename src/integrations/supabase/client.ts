import { createClient } from '@supabase/supabase-js'
import { setAuthentication, clearAuthentication, getAuthenticatedClient, getCurrentAuth } from '@/utils/supabaseAuth';

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk'

// Create the default Supabase client (for non-authenticated operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    }
  }
})

// Function to set the auth token for RLS policies
export const setSupabaseAuth = (token: string, username: string) => {
  console.log('🔐 Setting Supabase auth token for user:', username);
  setAuthentication(token, username);
  console.log('✅ Supabase auth token set successfully');
};

// Function to clear the auth token
export const clearSupabaseAuth = () => {
  console.log('🔓 Clearing Supabase auth token');
  clearAuthentication();
  console.log('✅ Supabase auth token cleared');
};

// Function to get current auth status
export const getSupabaseAuthStatus = () => {
  const { isAuthenticated, username } = getCurrentAuth();
  console.log('🔍 Supabase auth status:', isAuthenticated ? `Authenticated as ${username}` : 'Not authenticated');
  return isAuthenticated;
};

// Function to get authenticated client for system operations
export const getAuthenticatedSupabaseClient = () => {
  const client = getAuthenticatedClient();
  if (!client) {
    console.warn('⚠️ No auth token available for system operations, using default client');
    return supabase; // Return regular client as fallback
  }
  return client;
};

console.log('✅ Supabase client initialized successfully');

export default supabase;