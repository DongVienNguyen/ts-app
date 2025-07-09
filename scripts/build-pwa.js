import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building PWA...');

try {
  // Step 1: Generate icons
  console.log('📱 Generating PWA icons...');
  execSync('npm run generate-pwa-icons', { stdio: 'inherit' });
  
  // Step 2: Build the app
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 3: Copy PWA files to dist
  console.log('📋 Copying PWA files...');
  const distDir = path.join(process.cwd(), 'dist');
  const publicDir = path.join(process.cwd(), 'public');
  
  // Copy manifest.json
  fs.copyFileSync(
    path.join(publicDir, 'manifest.json'),
    path.join(distDir, 'manifest.json')
  );
  
  // Copy service worker
  fs.copyFileSync(
    path.join(publicDir, 'sw.js'),
    path.join(distDir, 'sw.js')
  );
  
  // Copy all icon files
  const iconFiles = fs.readdirSync(publicDir).filter(file => 
    file.includes('icon-') || 
    file.includes('apple-touch-icon-') || 
    file.includes('maskable-icon-') ||
    file === 'favicon.png'
  );
  
  iconFiles.forEach(file => {
    fs.copyFileSync(
      path.join(publicDir, file),
      path.join(distDir, file)
    );
  });
  
  console.log('✅ PWA build completed successfully!');
  console.log('📊 Build summary:');
  console.log(`   • Generated ${iconFiles.length} icon files`);
  console.log('   • Copied manifest.json');
  console.log('   • Copied service worker');
  console.log('   • Ready for deployment');
  
} catch (error) {
  console.error('❌ PWA build failed:', error.message);
  process.exit(1);
}