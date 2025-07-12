import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk'

const getSupabaseOptions = (token: string | null): SupabaseClientOptions<"public"> => {
  const headers: { [key: string]: string } = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers,
    },
  }
}

// Export supabase with `let` to allow re-assignment
export let supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, getSupabaseOptions(null));

export const updateSupabaseAuthToken = (token: string | null) => {
  supabase = createClient(supabaseUrl, supabaseAnonKey, getSupabaseOptions(token));
  console.log(`[AUTH] Supabase client updated.`);
};