import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk'

// Create the Supabase client
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

// Function to set the auth token for RLS policies (simplified for development)
export const setSupabaseAuth = (token: string, username: string) => {
  console.log('🔐 Setting Supabase auth token for user:', username);
  
  // Store the token and username
  currentAuthToken = token;
  currentUsername = username;
  
  console.log('✅ Supabase auth token stored successfully');
};

// Function to clear the auth token
export const clearSupabaseAuth = () => {
  console.log('🔓 Clearing Supabase auth token');
  
  // Clear stored token and username
  currentAuthToken = null;
  currentUsername = null;
  
  console.log('✅ Supabase auth token cleared');
};

// Function to get current auth status
export const getSupabaseAuthStatus = () => {
  const hasAuth = !!(currentAuthToken && currentUsername);
  console.log('🔍 Supabase auth status:', hasAuth ? `Authenticated as ${currentUsername}` : 'Not authenticated');
  return hasAuth;
};

// Test the connection
console.log('🔍 Testing Supabase connection...');
supabase
  .from('staff')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
    } else {
      console.log('✅ Supabase connection test successful');
    }
  });

export default supabase;