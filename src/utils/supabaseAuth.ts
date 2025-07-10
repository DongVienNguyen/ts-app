import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, getServiceRoleClient, getCurrentAuth } from '@/integrations/supabase/client';

// Store current auth state
let currentAuthToken: string | null = null;
let currentUsername: string | null = null;

// Set authentication - DON'T CREATE NEW CLIENT
export function setAuthentication(token: string, username: string) {
  currentAuthToken = token;
  currentUsername = username;
  console.log('🔐 Authentication set for user:', username);
}

// Clear authentication
export function clearAuthentication() {
  currentAuthToken = null;
  currentUsername = null;
  console.log('🔓 Authentication cleared');
}

// Get authenticated client - REUSE EXISTING CLIENT
export function getAuthenticatedClient(): SupabaseClient | null {
  if (!currentAuthToken) {
    console.warn('⚠️ No authenticated client available');
    return null;
  }
  // Return the same supabase client instance
  return supabase;
}

// Get current auth info
export { getCurrentAuth };

// Safe database operation wrapper with improved error handling
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
  } catch (error: any) {
    // Handle specific error types
    if (error?.code === '42501') {
      console.warn('⚠️ RLS policy violation - operation not permitted');
    } else if (error?.code === 'PGRST301') {
      console.warn('⚠️ JWT token expired or invalid');
    } else if (error?.message?.includes('401')) {
      console.warn('⚠️ Unauthorized - authentication required');
    } else {
      console.error('❌ Database operation failed:', error);
    }
    
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

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!(currentAuthToken && currentUsername);
}

// Get current user info
export function getCurrentUser() {
  return {
    token: currentAuthToken,
    username: currentUsername,
    isAuthenticated: isAuthenticated()
  };
}