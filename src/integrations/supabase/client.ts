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

export const updateSupabaseAuthToken = async (token: string | null) => {
  const oldClient = supabase;
  console.log('[AUTH] Starting Supabase client update...');
  
  console.log('[AUTH] Removing all channels from old client...');
  try {
    // This is a more robust way to clean up.
    await oldClient.removeAllChannels();
    console.log('[AUTH] All channels removed from old client.');
  } catch (e) {
    console.error('[AUTH] Error removing channels from old client:', e);
  }

  console.log('[AUTH] Disconnecting old Supabase realtime client...');
  try {
    await oldClient.realtime.disconnect();
    console.log('[AUTH] Old client disconnected successfully.');
  } catch (e) {
    console.error('[AUTH] Error disconnecting old client:', e);
  }
  
  console.log('[AUTH] Creating new Supabase client...');
  supabase = createClient(supabaseUrl, supabaseAnonKey, getSupabaseOptions(token));
  console.log(`[AUTH] Supabase client update complete. New client is ready.`);
};