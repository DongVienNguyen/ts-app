// Environment configuration
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const IS_DEVELOPMENT = isDevelopment; // Add alias for compatibility

// Supabase configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// VAPID configuration for push notifications
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_APP_VAPID_PUBLIC_KEY;

// API configuration
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000' 
  : 'https://your-production-domain.com';

// Time restrictions configuration
export const TIME_RESTRICTIONS = {
  restrictedHours: [
    { start: 7.75, end: 8.083 }, // 7:45 - 8:05
    { start: 12.75, end: 13.083 } // 12:45 - 13:05
  ]
};

// Camera and AI configuration
export const CAMERA_CONFIG = {
  // Maximum file size for image upload (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  
  // Supported image formats
  SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // Camera constraints for getUserMedia
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    facingMode: 'environment', // Prefer rear camera
    focusMode: 'continuous',
    exposureMode: 'continuous',
    whiteBalanceMode: 'continuous'
  },
  
  // Image capture settings
  CAPTURE_SETTINGS: {
    imageType: 'image/jpeg',
    imageQuality: 0.8,
    imageWidth: 1920,
    imageHeight: 1080
  }
};

// AI Analysis configuration
export const AI_CONFIG = {
  // Gemini API settings
  GEMINI_MODEL: 'gemini-1.5-flash',
  GEMINI_TEMPERATURE: 0.1,
  GEMINI_MAX_TOKENS: 1000,
  
  // Asset code detection patterns
  ASSET_CODE_PATTERNS: {
    // Main pattern for asset codes (12-15 digits)
    MAIN_PATTERN: /\d{12,15}/g,
    
    // Specific patterns for different departments
    DEPARTMENT_PATTERNS: {
      CMT8: /0424201\d+/g,
      NS: /0424202\d+/g,
      ĐS: /0424203\d+/g,
      LĐH: /0424204\d+/g,
      DVKH: /042300\d+/g,
      QLN: /042410\d+/g
    }
  },
  
  // Confidence thresholds
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5
  },
  
  // Retry settings
  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    BACKOFF_MULTIPLIER: 2
  }
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
  // Default notification settings
  DEFAULT_OPTIONS: {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200]
  },
  
  // Notification types
  TYPES: {
    ASSET_REMINDER: 'asset_reminder',
    CRC_REMINDER: 'crc_reminder',
    SYSTEM_UPDATE: 'system_update',
    ERROR_ALERT: 'error_alert'
  },
  
  // Auto-dismiss timers (in milliseconds)
  AUTO_DISMISS: {
    SUCCESS: 4000,
    INFO: 5000,
    WARNING: 6000,
    ERROR: 8000
  }
};

// Form validation configuration
export const VALIDATION_CONFIG = {
  // Asset code validation
  ASSET_CODE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 10,
    PATTERN: /^\d+\.\d{2}$/,
    ERROR_MESSAGES: {
      REQUIRED: 'Mã tài sản là bắt buộc',
      INVALID_FORMAT: 'Định dạng mã tài sản không hợp lệ (VD: 259.24)',
      MIN_LENGTH: 'Mã tài sản quá ngắn',
      MAX_LENGTH: 'Mã tài sản quá dài'
    }
  },
  
  // Date validation
  DATE: {
    MIN_DATE_OFFSET: -30, // 30 days ago
    MAX_DATE_OFFSET: 1, // 1 day in future
    ERROR_MESSAGES: {
      REQUIRED: 'Ngày giao dịch là bắt buộc',
      INVALID_DATE: 'Ngày không hợp lệ',
      OUT_OF_RANGE: 'Ngày nằm ngoài phạm vi cho phép'
    }
  }
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Image processing
  IMAGE_PROCESSING: {
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
    PARALLEL_LIMIT: 3, // Max 3 parallel processing tasks
    TIMEOUT: 30000 // 30 seconds timeout
  },
  
  // Caching
  CACHE: {
    ASSET_DATA_TTL: 5 * 60 * 1000, // 5 minutes
    USER_DATA_TTL: 15 * 60 * 1000, // 15 minutes
    STATIC_CACHE_TTL: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Debouncing
  DEBOUNCE: {
    SEARCH: 300, // 300ms for search inputs
    FORM_VALIDATION: 500, // 500ms for form validation
    API_CALLS: 1000 // 1 second for API calls
  }
};

// Feature flags
export const FEATURE_FLAGS = {
  AI_IMAGE_ANALYSIS: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_SUPPORT: true,
  CAMERA_CAPTURE: true,
  BULK_OPERATIONS: true,
  ADVANCED_SEARCH: true,
  EXPORT_FEATURES: true,
  REAL_TIME_UPDATES: true
};

// Debug configuration
export const DEBUG_CONFIG = {
  ENABLE_LOGGING: isDevelopment,
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  CURRENT_LOG_LEVEL: isDevelopment ? 3 : 1,
  
  // Performance monitoring
  PERFORMANCE_MONITORING: {
    ENABLED: isProduction,
    SAMPLE_RATE: 0.1, // 10% sampling in production
    THRESHOLDS: {
      SLOW_QUERY: 1000, // 1 second
      SLOW_RENDER: 100, // 100ms
      MEMORY_WARNING: 50 * 1024 * 1024 // 50MB
    }
  }
};

// Export all configurations
export default {
  CAMERA_CONFIG,
  AI_CONFIG,
  NOTIFICATION_CONFIG,
  VALIDATION_CONFIG,
  PERFORMANCE_CONFIG,
  FEATURE_FLAGS,
  DEBUG_CONFIG
};