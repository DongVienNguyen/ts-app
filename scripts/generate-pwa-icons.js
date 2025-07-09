import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '..', 'public');

// Create a simple green icon for PWA
const createBaseIcon = async () => {
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#grad1)" rx="64"/>
      <rect x="128" y="128" width="256" height="256" fill="white" rx="32"/>
      <g fill="#16a34a">
        <!-- Asset icon -->
        <rect x="180" y="180" width="40" height="120" rx="8"/>
        <rect x="240" y="180" width="40" height="120" rx="8"/>
        <rect x="300" y="180" width="40" height="120" rx="8"/>
        <rect x="180" y="320" width="160" height="40" rx="8"/>
        <!-- Management symbol -->
        <circle cx="200" cy="200" r="8"/>
        <circle cx="260" cy="200" r="8"/>
        <circle cx="320" cy="200" r="8"/>
      </g>
    </svg>
  `;
  
  const tempPath = path.join(__dirname, 'temp-icon.svg');
  fs.writeFileSync(tempPath, svgIcon);
  return tempPath;
};

const generateIcons = async () => {
  try {
    console.log('🎨 Generating PWA icons...');
    
    // Create base icon
    const iconPath = await createBaseIcon();
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate icons for all sizes
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(iconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 22, g: 163, b: 74, alpha: 1 }
        })
        .png({
          quality: 90,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }
    
    // Generate favicon
    const faviconPath = path.join(outputDir, 'favicon.ico');
    await sharp(iconPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));
    
    console.log('✅ Generated: favicon.png');
    
    // Generate Apple touch icons with proper sizing
    const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];
    for (const size of appleSizes) {
      const outputPath = path.join(outputDir, `apple-touch-icon-${size}x${size}.png`);
      
      await sharp(iconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 22, g: 163, b: 74, alpha: 1 }
        })
        .png({
          quality: 90,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated: apple-touch-icon-${size}x${size}.png`);
    }
    
    // Generate maskable icons (for Android adaptive icons)
    const maskableSizes = [192, 512];
    for (const size of maskableSizes) {
      const outputPath = path.join(outputDir, `maskable-icon-${size}x${size}.png`);
      
      // Create maskable icon with safe area
      const safeAreaSize = Math.floor(size * 0.8); // 80% safe area
      const padding = Math.floor((size - safeAreaSize) / 2);
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 22, g: 163, b: 74, alpha: 1 }
        }
      })
      .composite([
        {
          input: await sharp(iconPath)
            .resize(safeAreaSize, safeAreaSize, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer(),
          top: padding,
          left: padding
        }
      ])
      .png({
        quality: 90,
        compressionLevel: 9
      })
      .toFile(outputPath);
      
      console.log(`✅ Generated: maskable-icon-${size}x${size}.png`);
    }
    
    // Clean up temp file
    fs.unlinkSync(iconPath);
    
    console.log('🎉 All PWA icons generated successfully!');
    console.log(`📁 Icons saved to: ${outputDir}`);
    
    // Generate icon summary
    const iconFiles = fs.readdirSync(outputDir).filter(file => 
      file.startsWith('icon-') || 
      file.startsWith('apple-touch-icon-') || 
      file.startsWith('maskable-icon-') ||
      file === 'favicon.png'
    );
    
    console.log(`📊 Generated ${iconFiles.length} icon files:`);
    iconFiles.forEach(file => {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   • ${file} (${Math.round(stats.size / 1024)}KB)`);
    });
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
};

generateIcons();