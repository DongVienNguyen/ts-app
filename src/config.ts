// Application Configuration
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY || 'BLc4xRzKlP5EQ9vEGTVpsVu2cygGUh02aeczkgR4Cw0i3hVoVGVUYp1zKJT2kGHRkMv2yrIeN0zOjMiXKcBVm2Y';

// Development environment check
export const isDevelopment = import.meta.env.DEV;

// Time restrictions configuration
export const TIME_RESTRICTIONS = {
  restrictedHours: [
    { start: 22, end: 6 }, // 10 PM to 6 AM
    { start: 12, end: 13 } // 12 PM to 1 PM (lunch break)
  ]
};

// Camera configuration
export const CAMERA_CONFIG = {
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    frameRate: { ideal: 30, max: 30 }
  },
  CAPTURE_SETTINGS: {
    imageWidth: 1920,
    imageHeight: 1080,
    imageType: 'image/jpeg' as const,
    imageQuality: 0.8
  },
  SUPPORTED_FORMATS: [
    'image/jpeg',
    'image/png',
    'image/webp'
  ],
  MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
};

// Validate VAPID key on load
if (VAPID_PUBLIC_KEY) {
  console.log('🔑 VAPID Public Key loaded:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');
  
  // Basic validation
  if (VAPID_PUBLIC_KEY.length < 60) {
    console.warn('⚠️ VAPID Public Key seems too short - may cause issues');
  }
  
  if (!/^[A-Za-z0-9_-]+$/.test(VAPID_PUBLIC_KEY)) {
    console.warn('⚠️ VAPID Public Key contains invalid characters');
  }
} else {
  console.warn('⚠️ VAPID Public Key not configured - push notifications will not work');
}

// Other configuration
export const APP_CONFIG = {
  name: 'Asset Management System',
  version: '1.0.0',
  vapidPublicKey: VAPID_PUBLIC_KEY,
  pushNotifications: {
    enabled: !!VAPID_PUBLIC_KEY,
    maxRetries: 3,
    retryDelay: 1000
  }
};

export default APP_CONFIG;