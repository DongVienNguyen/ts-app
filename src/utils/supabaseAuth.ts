import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateSession } from '@/services/secureAuthService';

// Get authenticated client - REUSE EXISTING CLIENT
export function getAuthenticatedClient(): SupabaseClient {
  // The AuthContext ensures the Authorization header is set.
  return supabase;
}

// Check if user is authenticated based on localStorage
export function isAuthenticated(): boolean {
  return validateSession();
}

// Get current auth info from localStorage
export function getCurrentAuth() {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  const user = userStr ? JSON.parse(userStr) : null;

  return {
    isAuthenticated: isAuthenticated(),
    token: token,
    username: user?.username || null
  };
}

// Safe database operation wrapper with improved error handling
export async function safeDbOperation<T>(
  operation: (client: SupabaseClient) => Promise<T>,
  fallbackValue?: T,
): Promise<T | null> {
  if (!isAuthenticated()) {
    console.warn('⚠️ Cannot perform database operation: not authenticated');
    return fallbackValue || null;
  }

  try {
    const result = await operation(supabase); // Use the global supabase client
    return result;
  } catch (error: any) {
    // Handle specific error types
    if (error?.code === '42501' || error?.message?.includes('401') || error?.message?.includes('JWT expired')) {
      console.warn('⚠️ Auth error during DB operation:', error.message);
      // Optionally, trigger a logout here
    } else if (error?.code === 'PGRST301') {
      console.warn('⚠️ JWT token expired or invalid');
    } else {
      console.error('❌ Database operation failed:', error);
    }
    
    return fallbackValue || null;
  }
}

// Get current user info from localStorage
export function getCurrentUser() {
  const authInfo = getCurrentAuth();
  return {
    token: authInfo.token,
    username: authInfo.username,
    isAuthenticated: authInfo.isAuthenticated
  };
}