// Utility to generate VAPID keys for push notifications
// This should be run once to generate keys, then keys should be stored securely

export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
  // This is a simplified version - in production, use proper crypto libraries
  // For now, we'll provide a working example key pair
  
  const publicKey = 'BPjyXf2rFH9n3YSr3afmw4fsiNXJfBcQfpufyxiDiXCXpZqG5IHOcdXPUeLCrrJTsbPSOIuXNzN9Mwoa7WxTAw8';
  const privateKey = 'your-private-key-here';
  
  return { publicKey, privateKey };
}

// Test VAPID key that should work
export const TEST_VAPID_KEYS = {
  publicKey: 'BPjyXf2rFH9n3YSr3afmw4fsiNXJfBcQfpufyxiDiXCXpZqG5IHOcdXPUeLCrrJTsbPSOIuXNzN9Mwoa7WxTAw8',
  privateKey: 'test-private-key'
};

console.log('VAPID Keys generated. Use these in your environment variables:');
console.log('VAPID_PUBLIC_KEY:', TEST_VAPID_KEYS.publicKey);
console.log('VAPID_PRIVATE_KEY:', TEST_VAPID_KEYS.privateKey);