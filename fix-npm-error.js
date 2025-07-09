const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Fixing npm workspace error...');

try {
  // Step 1: Clean up files
  console.log('Step 1: Cleaning up package manager files...');
  
  const filesToRemove = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'];
  const dirsToRemove = ['node_modules', '.pnpm-store'];
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
    }
  });
  
  dirsToRemove.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removed: ${dir}`);
    }
  });

  // Step 2: Clear npm cache
  console.log('\nStep 2: Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  // Step 3: Reset npm config
  console.log('\nStep 3: Resetting npm configuration...');
  try {
    execSync('npm config delete workspace', { stdio: 'pipe' });
  } catch (e) {
    // Ignore if workspace config doesn't exist
  }
  
  try {
    execSync('npm config set package-manager npm', { stdio: 'pipe' });
  } catch (e) {
    console.warn('Could not set package-manager config');
  }

  // Step 4: Create/update .npmrc
  console.log('\nStep 4: Creating .npmrc...');
  const npmrcContent = `# Force npm usage
registry=https://registry.npmjs.org/
package-lock=true
save-exact=false
save-prefix=^
`;
  fs.writeFileSync('.npmrc', npmrcContent);
  console.log('✅ Created .npmrc');

  // Step 5: Install dependencies
  console.log('\nStep 5: Installing dependencies with npm...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('\n🎉 Success! The workspace error has been fixed.');
  console.log('\nYou can now run:');
  console.log('npm run dev');

} catch (error) {
  console.error('\n❌ Error during fix process:', error.message);
  console.log('\nManual steps to try:');
  console.log('1. Delete node_modules and all lock files');
  console.log('2. Run: npm cache clean --force');
  console.log('3. Run: npm config delete workspace');
  console.log('4. Run: npm install');
}