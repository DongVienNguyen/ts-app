// Environment configuration
export const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

// VAPID configuration for push notifications
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY || 'BLc4xRzKlP5EQ9vEGTVpsVu2cygGUh02aeczkgR4Cw0i3hVoVGVUYp1zKJT2kGHRkMv2yrIeN0zOjMiXKcBVm2Y';

// Camera configuration
export const CAMERA_CONFIG = {
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    aspectRatio: { ideal: 16/9 }
  },
  CAPTURE_SETTINGS: {
    imageWidth: 1920,
    imageHeight: 1080,
    imageType: 'image/jpeg' as const,
    imageQuality: 0.8
  },
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
};

// Time restrictions configuration
export const TIME_RESTRICTIONS = {
  restrictedHours: [
    { start: 7.75, end: 8.083 }, // 7:45 - 8:05
    { start: 12.75, end: 13.083 } // 12:45 - 13:05
  ]
};

// Other configuration constants
export const API_CONFIG = {
  timeout: 30000,
  retries: 3
};

export const FORM_CONFIG = {
  maxAssets: 10,
  minAssets: 1
};

export const NOTIFICATION_CONFIG = {
  defaultDuration: 4000,
  errorDuration: 6000,
  successDuration: 4000
};

// Asset validation patterns
export const ASSET_PATTERNS = {
  assetCode: /^\d+\.\d{4}$/,
  room: /^[A-Za-z0-9]+$/
};

// Default values
export const DEFAULT_VALUES = {
  transactionDate: () => new Date().toISOString().split('T')[0],
  partDay: 'sang',
  room: '',
  transactionType: ''
};

export default {
  isDevelopment,
  VAPID_PUBLIC_KEY,
  CAMERA_CONFIG,
  TIME_RESTRICTIONS,
  API_CONFIG,
  FORM_CONFIG,
  NOTIFICATION_CONFIG,
  ASSET_PATTERNS,
  DEFAULT_VALUES
};