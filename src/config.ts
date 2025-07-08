// Application configuration
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY || 'BNxKjDwF8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9QjQZ8Z9Q';

export const APP_CONFIG = {
  name: 'Asset Management System',
  version: '1.0.0',
  description: 'Hệ thống quản lý tài sản',
  author: 'Asset Management Team',
};

export const API_CONFIG = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export const NOTIFICATION_CONFIG = {
  vapidPublicKey: VAPID_PUBLIC_KEY,
  enablePushNotifications: true,
  enableInAppNotifications: true,
};