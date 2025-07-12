import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Get authenticated client - REUSE EXISTING CLIENT
export function getAuthenticatedClient(): SupabaseClient | null {
  // The AuthContext ensures the Authorization header is set via setSession.
  // We just need to return the client.
  return supabase;
}

// Get current auth info
export async function getCurrentAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    isAuthenticated: !!session,
    token: session?.access_token || null,
    username: session?.user?.user_metadata?.username || null // Assuming username is in user_metadata
  };
}

// Safe database operation wrapper with improved error handling
export async function safeDbOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T,
): Promise<T | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('⚠️ Cannot perform database operation: not authenticated');
    return fallbackValue || null;
  }

  try {
    const result = await operation(supabase); // Use the global supabase client
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

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// Get current user info
export async function getCurrentUser() {
  const authInfo = await getCurrentAuth();
  return {
    token: authInfo.token,
    username: authInfo.username,
    isAuthenticated: authInfo.isAuthenticated
  };
}