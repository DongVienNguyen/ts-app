import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Auth state management
let currentAuthToken: string | null = null;
let currentUsername: string | null = null;

// Set authentication
export function setSupabaseAuth(token: string, username: string) {
  currentAuthToken = token;
  currentUsername = username;
}

// Clear authentication
export function clearSupabaseAuth() {
  currentAuthToken = null;
  currentUsername = null;
}

// Get authenticated client
export function getAuthenticatedClient() {
  if (!currentAuthToken) {
    return null;
  }
  return supabase;
}

// Get service role client (for system operations)
export function getServiceRoleClient() {
  // For now, return the same client - in production you'd use service role key
  return supabase;
}

// Get current auth info
export function getCurrentAuth() {
  return {
    token: currentAuthToken,
    username: currentUsername,
    isAuthenticated: !!(currentAuthToken && currentUsername)
  };
}