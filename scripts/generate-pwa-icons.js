import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '..', 'public');

// Create the TS icon with green theme
const createBaseIcon = async () => {
  const svgIcon = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background gradient - dark green -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#14532d;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#166534;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
        </linearGradient>
        
        <!-- White gradient for text and circles -->
        <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
        </linearGradient>
        
        <!-- Shadow filter -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      
      <!-- Background with rounded corners -->
      <rect width="512" height="512" rx="80" fill="url(#bgGrad)"/>
      
      <!-- Outer circle -->
      <circle cx="256" cy="256" r="200" stroke="url(#whiteGrad)" stroke-width="8" fill="none" opacity="0.9"/>
      
      <!-- Inner circle -->
      <circle cx="256" cy="256" r="170" stroke="url(#whiteGrad)" stroke-width="4" fill="none" opacity="0.7"/>
      
      <!-- Small decorative circle (top right) -->
      <circle cx="380" cy="132" r="20" fill="url(#whiteGrad)" opacity="0.8" filter="url(#shadow)"/>
      
      <!-- TS Text -->
      <g filter="url(#shadow)">
        <!-- T -->
        <path d="M 180 180 L 280 180 L 280 210 L 240 210 L 240 330 L 210 330 L 210 210 L 180 210 Z" 
              fill="url(#whiteGrad)" stroke="url(#whiteGrad)" stroke-width="2"/>
        
        <!-- S -->
        <path d="M 300 180 
                 L 380 180 
                 L 380 210 
                 L 330 210 
                 L 330 240 
                 L 370 240 
                 L 370 270 
                 L 330 270 
                 L 330 300 
                 L 380 300 
                 L 380 330 
                 L 300 330 
                 L 300 300 
                 L 350 300 
                 L 350 270 
                 L 310 270 
                 L 310 240 
                 L 350 240 
                 L 350 210 
                 L 300 210 
                 Z" 
              fill="url(#whiteGrad)" stroke="url(#whiteGrad)" stroke-width="2"/>
      </g>
      
      <!-- Subtle highlight on top -->
      <ellipse cx="256" cy="100" rx="150" ry="30" fill="rgba(255,255,255,0.15)"/>
    </svg>
  `;
  
  const tempPath = path.join(__dirname, 'temp-icon.svg');
  fs.writeFileSync(tempPath, svgIcon);
  return tempPath;
};

const generateIcons = async () => {
  try {
    console.log('🎨 Generating PWA icons with green TS design...');
    
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
          background: { r: 20, g: 83, b: 45, alpha: 1 } // Dark green background
        })
        .png({
          quality: 100,
          compressionLevel: 6,
          palette: false
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }
    
    // Generate favicon
    const faviconPath = path.join(outputDir, 'favicon.png');
    await sharp(iconPath)
      .resize(32, 32)
      .png({
        quality: 100,
        compressionLevel: 6
      })
      .toFile(faviconPath);
    
    console.log('✅ Generated: favicon.png');
    
    // Generate Apple touch icons with proper sizing
    const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];
    for (const size of appleSizes) {
      const outputPath = path.join(outputDir, `apple-touch-icon-${size}x${size}.png`);
      
      await sharp(iconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 20, g: 83, b: 45, alpha: 1 }
        })
        .png({
          quality: 100,
          compressionLevel: 6
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated: apple-touch-icon-${size}x${size}.png`);
    }
    
    // Generate maskable icons (for Android adaptive icons)
    const maskableSizes = [192, 512];
    for (const size of maskableSizes) {
      const outputPath = path.join(outputDir, `maskable-icon-${size}x${size}.png`);
      
      // Create maskable icon with safe area (80% of the icon should be in safe area)
      const safeAreaSize = Math.floor(size * 0.8);
      const padding = Math.floor((size - safeAreaSize) / 2);
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 20, g: 83, b: 45, alpha: 1 }
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
        quality: 100,
        compressionLevel: 6
      })
      .toFile(outputPath);
      
      console.log(`✅ Generated: maskable-icon-${size}x${size}.png`);
    }
    
    // Clean up temp file
    fs.unlinkSync(iconPath);
    
    console.log('🎉 All PWA icons generated successfully with green TS design!');
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