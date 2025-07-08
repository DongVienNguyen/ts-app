export interface Staff {
  id: string;
  username: string;
  staff_name?: string;
  role: 'admin' | 'user';
  department: string;
  account_status: 'active' | 'locked';
  failed_login_attempts?: number;
  last_failed_login?: string;
  locked_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: Staff;
  token?: string;
  error?: string;
}

export interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}