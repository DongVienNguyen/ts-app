import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://itoapoyrxxmtbbuolfhk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk';

// Create SINGLE Supabase client instance - this is the root cause of the issue
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Create SINGLE service role client
let serviceRoleClient: any = null;

const createServiceRoleClient = () => {
  if (serviceRoleClient) {
    return serviceRoleClient; // Return existing instance
  }

  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceRoleKey) {
    console.log('🔑 Creating service role client');
    serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } else {
    console.warn('⚠️ Service role key not found, using anon client');
    serviceRoleClient = supabase; // Use the same instance
  }
  
  return serviceRoleClient;
};

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

// Get authenticated client for user operations - REUSE SAME CLIENT
export function getAuthenticatedClient() {
  if (!currentAuthToken) {
    console.warn('⚠️ No auth token available');
    return null;
  }
  
  // DON'T CREATE NEW CLIENT - just return the existing one with auth info
  return supabase;
}

// Get service role client for system operations
export function getServiceRoleClient() {
  return createServiceRoleClient();
}

// Export the SINGLE client instance
export { supabase };
export default supabase;

console.log('✅ Supabase client initialized successfully');