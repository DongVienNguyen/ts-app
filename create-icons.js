// Simple script to create basic PNG icons
// Run with: node create-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG that can be converted to PNG
const svgContent = `
<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#16a34a" rx="24"/>
  <rect x="48" y="48" width="96" height="96" fill="white" rx="12"/>
  <rect x="64" y="64" width="64" height="8" fill="#16a34a" rx="4"/>
  <rect x="64" y="80" width="48" height="8" fill="#16a34a" rx="4"/>
  <rect x="64" y="96" width="56" height="8" fill="#16a34a" rx="4"/>
  <rect x="64" y="112" width="40" height="8" fill="#16a34a" rx="4"/>
</svg>
`;

// Write SVG file
fs.writeFileSync(path.join(__dirname, 'public', 'icon.svg'), svgContent);

console.log('✅ Icon SVG created at public/icon.svg');
console.log('📝 To create PNG icons, use an online SVG to PNG converter or install sharp:');
console.log('   npm install sharp');
console.log('   Then convert the SVG to PNG files');