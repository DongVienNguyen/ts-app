import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'asset-management-app'
    },
    fetch: (url, options: RequestInit = {}) => {
      console.log('🌐 Supabase fetch:', url);
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache',
        },
      })
      .then(response => {
        clearTimeout(timeoutId);
        console.log('✅ Supabase response:', response.status, response.statusText);
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('❌ Supabase fetch error:', error);
        
        // Provide more specific error messages
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your internet connection');
        } else if (error.message.includes('fetch failed')) {
          throw new Error('Network error - please check your internet connection and try again');
        } else {
          throw error;
        }
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Add connection test function
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('staff').select('count').limit(1).single();
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return false;
  }
};

// Test connection on client initialization
testSupabaseConnection().then(isConnected => {
  if (!isConnected) {
    console.warn('⚠️ Supabase connection test failed - some features may not work properly');
  }
});

export default supabase;