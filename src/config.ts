// Application configuration
export const APP_CONFIG = {
  name: 'Hệ thống Quản lý Tài sản',
  version: '1.0.0',
  description: 'Hệ thống quản lý tài sản và nhắc nhở',
};

// Time restrictions
export const TIME_RESTRICTIONS = {
  restrictedHours: [
    { start: 8, end: 8.08 }, // 8:00-8:05
    { start: 12.75, end: 13.08 }, // 12:45-13:05
  ],
};

// Date formats
export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  input: 'yyyy-MM-dd',
  datetime: 'dd/MM/yyyy HH:mm',
  dayMonth: 'dd-MM',
};

// Pagination
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
};

// File upload
export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
};

// Email settings
export const EMAIL_CONFIG = {
  defaultDomain: '@company.com',
  adminEmail: 'admin@company.com',
};

// Push notification settings
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY || '';

// API endpoints
export const API_ENDPOINTS = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
};

// Asset codes validation
export const ASSET_CODE_REGEX = /^\d{1,4}\.\d{2}$/;

// Departments
export const DEPARTMENTS = [
  'QLN',
  'CMT8', 
  'NS',
  'ĐS',
  'LĐH',
  'DVKH',
  'NQ',
] as const;

// Roles
export const ROLES = [
  'admin',
  'user',
] as const;

// Transaction types
export const TRANSACTION_TYPES = [
  'Xuất kho',
  'Mượn TS',
  'Thay bìa',
] as const;

// Parts of day
export const PARTS_OF_DAY = [
  'Sáng',
  'Chiều',
] as const;

// Rooms
export const ROOMS = [
  'QLN',
  'CMT8',
  'NS', 
  'ĐS',
  'LĐH',
  'DVKH',
] as const;

// Account status
export const ACCOUNT_STATUS = [
  'active',
  'locked',
  'inactive',
] as const;

// Notification types
export const NOTIFICATION_TYPES = [
  'asset_reminder',
  'crc_reminder',
  'transaction_result',
  'system_alert',
  'error_report',
] as const;

// Default values
export const DEFAULT_VALUES = {
  pageSize: 10,
  maxRetries: 3,
  timeoutMs: 30000,
  debounceMs: 300,
};

// Feature flags
export const FEATURES = {
  enablePushNotifications: true,
  enableImageProcessing: true,
  enableOfflineMode: false,
  enableAnalytics: false,
};

// Environment
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

// Local storage keys
export const STORAGE_KEYS = {
  authToken: 'auth_token',
  userPreferences: 'user_preferences',
  offlineData: 'offline_data',
  lastSync: 'last_sync',
};

// Error messages
export const ERROR_MESSAGES = {
  networkError: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  unauthorized: 'Bạn không có quyền truy cập.',
  forbidden: 'Truy cập bị từ chối.',
  notFound: 'Không tìm thấy dữ liệu.',
  serverError: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  validationError: 'Dữ liệu không hợp lệ.',
  timeoutError: 'Hết thời gian chờ. Vui lòng thử lại.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  created: 'Tạo mới thành công',
  updated: 'Cập nhật thành công',
  deleted: 'Xóa thành công',
  sent: 'Gửi thành công',
  saved: 'Lưu thành công',
};