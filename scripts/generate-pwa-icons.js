import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [48, 72, 96, 144, 168, 192, 512];
const outputDir = path.join(__dirname, '..', 'public');

// Create a simple, robust SVG icon
const createBaseIcon = async () => {
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="80" fill="#166534"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="250" font-weight="bold" fill="white">TS</text>
    </svg>
  `;
  
  const tempPath = path.join(__dirname, 'temp-icon.svg');
  fs.writeFileSync(tempPath, svgIcon);
  return tempPath;
};

const generateIcons = async () => {
  try {
    console.log('🎨 Generating PWA icons with a simplified and robust design...');
    
    const iconPath = await createBaseIcon();
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const sharpOptions = {
      quality: 90,
      compressionLevel: 6,
    };

    // Generate standard icons
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(iconPath)
        .resize(size, size)
        .png(sharpOptions)
        .toFile(outputPath);
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }
    
    // Generate favicon
    const faviconPath = path.join(outputDir, 'favicon.ico');
    await sharp(iconPath)
      .resize(32)
      .toFile(faviconPath);
    console.log('✅ Generated: favicon.ico');
    
    // Generate Apple touch icon
    const appleIconPath = path.join(outputDir, `apple-touch-icon.png`);
    await sharp(iconPath)
      .resize(180, 180)
      .png(sharpOptions)
      .toFile(appleIconPath);
    console.log(`✅ Generated: apple-touch-icon.png`);
    
    // Generate maskable icon (required for better PWA experience)
    const maskableIconPath = path.join(outputDir, `maskable-icon-192x192.png`);
    await sharp(iconPath)
      .resize(192, 192)
      .png(sharpOptions)
      .toFile(maskableIconPath);
    console.log(`✅ Generated: maskable-icon-192x192.png`);
    
    fs.unlinkSync(iconPath);
    
    console.log('🎉 All PWA icons generated successfully!');
    console.log(`📁 Icons saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
};

generateIcons();