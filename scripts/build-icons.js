const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Building TS Manager icons...');

try {
  // Run the icon generation script
  execSync('node scripts/generate-pwa-icons.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ TS Manager icons built successfully!');
} catch (error) {
  console.error('❌ Error building icons:', error.message);
  process.exit(1);
}