const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size/8}" fill="#16a34a"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/3}" stroke="white" stroke-width="${size/16}" fill="none"/>
      <path d="M${size/4} ${size/2}L${size/2.2} ${size*0.65}L${size*0.75} ${size/3}" stroke="white" stroke-width="${size/16}" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const outputPath = path.join(__dirname, '..', 'public', `icon-${size}x${size}.png`);
  
  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`❌ Error creating icon-${size}x${size}.png:`, error);
  }
}

async function generateAllIcons() {
  const sizes = [16, 32, 192, 512];
  
  console.log('🎨 Generating PNG icons...');
  
  for (const size of sizes) {
    await createIcon(size);
  }
  
  console.log('✅ All icons generated successfully!');
}

generateAllIcons().catch(console.error);