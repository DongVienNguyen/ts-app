import { createClient, SupabaseClientOptions } from '@supabase/supabase-js'

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk'

// Auth state management - these variables will be used by customFetch
let currentAuthToken: string | null = null;
let currentUsername: string | null = null;

// Custom fetch to bypass service worker cache for Supabase API requests
const customFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // Ensure we don't cache Supabase API calls, which can cause issues with service workers
  // and partial responses (status 206).
  const newInit: RequestInit = { ...init, cache: 'no-store' };

  // Add Authorization header if currentAuthToken exists
  if (currentAuthToken) {
    newInit.headers = {
      ...newInit.headers, // Preserve existing headers
      'Authorization': `Bearer ${currentAuthToken}`,
    };
  }
  return fetch(input, newInit);
};

const options: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    fetch: customFetch, // Use our custom fetch function
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options)

// Set authentication - now only updates the local token variable
export function setSupabaseAuth(token: string, username:string) {
  currentAuthToken = token;
  currentUsername = username;
  // The customFetch function will now automatically pick up this token for all requests
}

// Clear authentication - now only clears the local token variable
export function clearSupabaseAuth() {
  currentAuthToken = null;
  currentUsername = null;
  // The customFetch function will no longer add the token
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