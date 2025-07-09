const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size/8}" fill="#16a34a"/>
  <path d="M${size/4} ${size/2}L${size/2.2} ${size*0.65}L${size*0.75} ${size/3}" stroke="white" stroke-width="${size/16}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" stroke="white" stroke-width="${size/32}" fill="none"/>
</svg>
`;

// Create PNG from SVG (simplified - just create a colored square for now)
const createPNGData = (size) => {
  // This is a minimal PNG data for a green square
  // In production, you'd use a proper image library
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    // ... minimal PNG data for a green square
  ]);
};

// Create icon files
const sizes = [16, 32, 192, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(publicDir, `icon-${size}x${size}.svg`);
  
  try {
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ Created icon-${size}x${size}.svg`);
  } catch (error) {
    console.error(`❌ Error creating icon-${size}x${size}.svg:`, error);
  }
});

console.log('🎨 Icon creation completed!');