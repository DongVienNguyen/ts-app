export interface Staff {
  id: string;
  username: string;
  staff_name?: string;
  role: 'admin' | 'user';
  department?: string;
  account_status: 'active' | 'locked' | 'inactive';
  failed_login_attempts?: number;
  last_failed_login?: string;
  locked_at?: string;
  created_at?: string;
  updated_at?: string;
  email?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
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
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

export interface JWTPayload {
  username: string;
  role: string;
  department?: string;
  iss: string;
  sub: string;
  exp: number;
  iat?: number;
}

export interface SecurityEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGIN_ERROR' | 'LOGOUT' | 'SESSION_RESTORED' | 'TOKEN_EXPIRED' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED';
  timestamp: string;
  username?: string;
  data?: any;
  userAgent: string;
  ip?: string;
}

export interface PasswordResetRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountLockInfo {
  isLocked: boolean;
  lockedAt?: string;
  failedAttempts: number;
  canRetryAt?: string;
}

export type UserRole = 'admin' | 'user';
export type AccountStatus = 'active' | 'locked' | 'inactive';
export type Department = 'QLN' | 'CMT8' | 'NS' | 'ĐS' | 'LĐH' | 'DVKH' | 'NQ';