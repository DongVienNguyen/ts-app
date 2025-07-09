const { execSync } = require('child_process');
const path = require('path');

console.log('🌿 Building green TS Manager icons...');

try {
  // Run the icon generation script
  execSync('node scripts/generate-pwa-icons.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Green TS Manager icons built successfully!');
  console.log('🎨 Theme: Dark green background with white TS text');
  console.log('📁 All PWA icon sizes generated');
} catch (error) {
  console.error('❌ Error building icons:', error.message);
  process.exit(1);
}