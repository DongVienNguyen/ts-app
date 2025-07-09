import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const inputIcon = 'public/vite.svg'; // Base icon
const outputDir = 'public';

// Create a simple green icon if vite.svg doesn't exist
const createBaseIcon = async () => {
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#16a34a" rx="64"/>
      <rect x="128" y="128" width="256" height="256" fill="white" rx="32"/>
      <rect x="160" y="160" width="64" height="192" fill="#16a34a" rx="8"/>
      <rect x="288" y="160" width="64" height="192" fill="#16a34a" rx="8"/>
      <rect x="160" y="288" width="192" height="64" fill="#16a34a" rx="8"/>
    </svg>
  `;
  
  fs.writeFileSync('temp-icon.svg', svgIcon);
  return 'temp-icon.svg';
};

const generateIcons = async () => {
  try {
    let iconPath = inputIcon;
    
    // Check if input icon exists, if not create a simple one
    if (!fs.existsSync(inputIcon)) {
      console.log('Creating base icon...');
      iconPath = await createBaseIcon();
    }
    
    console.log('Generating PWA icons...');
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(iconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 22, g: 163, b: 74, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`Generated: ${outputPath}`);
    }
    
    // Generate favicon
    await sharp(iconPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));
    
    console.log('Generated: favicon.png');
    
    // Clean up temp file
    if (iconPath === 'temp-icon.svg') {
      fs.unlinkSync('temp-icon.svg');
    }
    
    console.log('✅ All PWA icons generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
};

generateIcons();