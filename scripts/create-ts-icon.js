import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createTSIcon = async () => {
  const outputPath = path.join(__dirname, '..', 'public', 'icon-192x192.png');
  
  // Create SVG based on the provided image
  const svgIcon = `
    <svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background gradient - green theme -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2d5a3d;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#3d6b4d;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4d7c5d;stop-opacity:1" />
        </linearGradient>
        
        <!-- White gradient for text -->
        <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
        </linearGradient>
        
        <!-- Shadow filter -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      
      <!-- Background with rounded corners -->
      <rect width="192" height="192" rx="32" fill="url(#bgGrad)"/>
      
      <!-- Outer circle -->
      <circle cx="96" cy="96" r="75" stroke="url(#whiteGrad)" stroke-width="3" fill="none" opacity="0.9"/>
      
      <!-- Inner circle -->
      <circle cx="96" cy="96" r="63" stroke="url(#whiteGrad)" stroke-width="2" fill="none" opacity="0.7"/>
      
      <!-- Small decorative circle (top right) -->
      <circle cx="142" cy="50" r="8" fill="url(#whiteGrad)" opacity="0.8" filter="url(#shadow)"/>
      
      <!-- TS Text -->
      <g filter="url(#shadow)">
        <!-- T -->
        <path d="M 67 67 L 105 67 L 105 78 L 90 78 L 90 125 L 79 125 L 79 78 L 67 78 Z" 
              fill="url(#whiteGrad)" stroke="url(#whiteGrad)" stroke-width="1"/>
        
        <!-- S -->
        <path d="M 112 67 
                 L 142 67 
                 L 142 78 
                 L 123 78 
                 L 123 89 
                 L 138 89 
                 L 138 100 
                 L 123 100 
                 L 123 114 
                 L 142 114 
                 L 142 125 
                 L 112 125 
                 L 112 114 
                 L 131 114 
                 L 131 100 
                 L 116 100 
                 L 116 89 
                 L 131 89 
                 L 131 78 
                 L 112 78 
                 Z" 
              fill="url(#whiteGrad)" stroke="url(#whiteGrad)" stroke-width="1"/>
      </g>
      
      <!-- Subtle highlight on top -->
      <ellipse cx="96" cy="38" rx="56" ry="11" fill="rgba(255,255,255,0.15)"/>
    </svg>
  `;
  
  try {
    // Convert SVG to PNG
    await sharp(Buffer.from(svgIcon))
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 45, g: 90, b: 61, alpha: 1 }
      })
      .png({
        quality: 100,
        compressionLevel: 6,
        palette: false
      })
      .toFile(outputPath);
    
    console.log('✅ Created icon-192x192.png successfully');
    
    // Verify the file
    const stats = fs.statSync(outputPath);
    console.log(`📊 File size: ${Math.round(stats.size / 1024)}KB`);
    
  } catch (error) {
    console.error('❌ Error creating icon:', error);
    process.exit(1);
  }
};

createTSIcon();