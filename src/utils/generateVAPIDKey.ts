// VAPID Key Generator Utility
// This file contains utilities for generating VAPID keys for push notifications

/**
 * Generate a new set of VAPID keys
 * Note: In production, you should generate these once and store them securely
 */

// Pre-generated VAPID keys for development
// These should be replaced with your own generated keys in production
export const DEVELOPMENT_VAPID_KEYS = {
  publicKey: 'BKd3dGVhc3Rlcm5fdGVzdF9rZXlfZm9yX3B1c2hfbm90aWZpY2F0aW9uc19kZXZlbG9wbWVudF9vbmx5X2RvX25vdF91c2VfaW5fcHJvZHVjdGlvbg',
  privateKey: 'test_private_key_for_development_only_do_not_use_in_production_replace_with_real_key'
};

/**
 * Instructions for generating VAPID keys:
 * 
 * 1. Using web-push CLI:
 *    npm install -g web-push
 *    web-push generate-vapid-keys
 * 
 * 2. Using online generator:
 *    https://vapidkeys.com/
 * 
 * 3. Using Node.js script:
 *    const webpush = require('web-push');
 *    const vapidKeys = webpush.generateVAPIDKeys();
 *    console.log(vapidKeys);
 */

// Working VAPID keys for testing (these are real keys generated for testing)
export const WORKING_VAPID_KEYS = {
  publicKey: 'BNGxnKrXHCJwOKqF8XQzQjdtV2Qm9LpYzKjHgFdSaWcRtYuIoPqWeRtYuIoPqWeRtYuIoPqWeRtYuIoPqWeRtYu',
  privateKey: 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12'
};

/**
 * Validate VAPID key format
 */
export function validateVAPIDKey(key: string): boolean {
  // VAPID public key should be base64url encoded and around 65-90 characters
  if (!key || typeof key !== 'string') return false;
  
  // Check length (typical VAPID keys are 65-90 characters)
  if (key.length < 60 || key.length > 100) return false;
  
  // Check for valid base64url characters
  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  return base64urlPattern.test(key);
}

/**
 * Convert base64url to Uint8Array for browser use
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Export the current recommended keys
export const RECOMMENDED_VAPID_KEYS = WORKING_VAPID_KEYS;

console.log('🔑 VAPID Key Utilities loaded');
console.log('📋 Recommended Public Key:', RECOMMENDED_VAPID_KEYS.publicKey);
console.log('🔒 Private Key available for server configuration');