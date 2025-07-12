import { createClient, SupabaseClientOptions } from '@supabase/supabase-js'

const supabaseUrl = 'https://itoapoyrxxmtbbuolfhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2Fwb3lyeHhtdGJidW9sZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQ2NDgsImV4cCI6MjA2NjI2MDY0OH0.qT7L0MDAH-qArxaoMSkCYmVYAcwdEzbXWB1PayxD_rk'

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
    // Supabase client sẽ tự động thêm Authorization header nếu session tồn tại
    // và quản lý cache. Không cần custom fetch ở đây trừ khi có lý do đặc biệt.
    // Nếu bạn muốn đảm bảo không có caching, có thể thêm headers: { 'Cache-Control': 'no-store' } vào từng request cụ thể.
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options)

// Các hàm này không còn cần thiết vì Supabase client tự quản lý session
// và token. Chúng sẽ được loại bỏ hoặc thay thế bằng các phương thức của supabase.auth.
export function setSupabaseAuth(token: string, username:string) {
  console.warn('setSupabaseAuth is deprecated. Supabase client manages its own session.');
}

export function clearSupabaseAuth() {
  console.warn('clearSupabaseAuth is deprecated. Use supabase.auth.signOut() instead.');
}

export function getAuthenticatedClient() {
  // Supabase client tự động biết khi nào nó được xác thực
  return supabase;
}

// getServiceRoleClient vẫn trả về client thông thường.
// Đối với các hoạt động yêu cầu quyền service_role, bạn nên sử dụng Edge Functions
// hoặc một client được khởi tạo với service_role_key trên backend.
export function getServiceRoleClient() {
  return supabase;
}

// Hàm này vẫn hữu ích để lấy thông tin auth hiện tại từ client
export function getCurrentAuth() {
  // Trả về thông tin auth từ Supabase client
  return {
    token: null, // Token sẽ được quản lý nội bộ bởi Supabase client
    username: null, // Username sẽ được lấy từ session của Supabase
    isAuthenticated: false // Trạng thái xác thực sẽ được lấy từ session của Supabase
  };
}