import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServiceRoleClient, getCurrentAuth } from '@/integrations/supabase/client';

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk';

// Store current auth state
let currentAuthToken: string | null = null;
let currentUsername: string | null = null;
let authenticatedClient: SupabaseClient | null = null;

// Create authenticated Supabase client
export function createAuthenticatedClient(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    }
  });
}

// Set authentication
export function setAuthentication(token: string, username: string) {
  currentAuthToken = token;
  currentUsername = username;
  authenticatedClient = createAuthenticatedClient(token);
  console.log('🔐 Authentication set for user:', username);
}

// Clear authentication
export function clearAuthentication() {
  currentAuthToken = null;
  currentUsername = null;
  authenticatedClient = null;
  console.log('🔓 Authentication cleared');
}

// Get authenticated client
export function getAuthenticatedClient(): SupabaseClient | null {
  if (!currentAuthToken || !authenticatedClient) {
    console.warn('⚠️ No authenticated client available');
    return null;
  }
  return authenticatedClient;
}

// Get current auth info
export { getCurrentAuth };

// Safe database operation wrapper
export async function safeDbOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T,
  useServiceRole: boolean = false
): Promise<T | null> {
  let client: SupabaseClient | null = null;
  
  if (useServiceRole) {
    // Use service role client for system operations (bypasses RLS)
    client = getServiceRoleClient();
    console.log('🔧 Using service role client for system operation');
  } else {
    // Use authenticated client for user operations
    client = getAuthenticatedClient();
    if (!client) {
      console.warn('⚠️ Cannot perform database operation: not authenticated');
      return fallbackValue || null;
    }
  }

  try {
    const result = await operation(client);
    if (useServiceRole) {
      console.log('✅ System operation completed successfully');
    }
    return result;
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    return fallbackValue || null;
  }
}

// System operation wrapper - always uses service role
export async function systemDbOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T
): Promise<T | null> {
  return safeDbOperation(operation, fallbackValue, true);
}