const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up pnpm artifacts and resetting to npm...');

const filesToRemove = [
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.pnpmfile.cjs',
  'package-lock.json', // Remove this too to start fresh
];

const dirsToRemove = [
  'node_modules',
  '.pnpm-store',
  'node_modules/.pnpm'
];

// Remove files
filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      console.warn(`⚠️  Could not remove ${file}:`, error.message);
    }
  }
});

// Remove directories
dirsToRemove.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${dir}`);
    } catch (error) {
      console.warn(`⚠️  Could not remove ${dir}:`, error.message);
    }
  }
});

// Check if .npmrc exists, if not create it
if (!fs.existsSync('.npmrc')) {
  const npmrcContent = `# Force npm usage
package-manager=npm
engine-strict=true
registry=https://registry.npmjs.org/
save-exact=false
save-prefix=^
`;
  fs.writeFileSync('.npmrc', npmrcContent);
  console.log('✅ Created .npmrc file');
}

console.log('');
console.log('🎉 Cleanup complete!');
console.log('');
console.log('Next steps:');
console.log('1. npm cache clean --force');
console.log('2. npm install');
console.log('3. npm run dev');
console.log('');
console.log('If you still get workspace errors, run:');
console.log('npm config set package-manager npm');
console.log('npm config delete workspace');
console.log('');