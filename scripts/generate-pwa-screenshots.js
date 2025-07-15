import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'public', 'screenshots');

const createScreenshot = async (width, height, text, outputPath) => {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#333">${text}</text>
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="#ccc" stroke-width="4" rx="20"/>
    </svg>
  `;
  await sharp(Buffer.from(svg))
    .png({ quality: 90 })
    .toFile(outputPath);
  console.log(`✅ Generated: ${path.basename(outputPath)}`);
};

const generateScreenshots = async () => {
  try {
    console.log('📸 Generating PWA placeholder screenshots...');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await createScreenshot(375, 812, 'Mobile View', path.join(outputDir, 'mobile-screenshot-1.png'));
    await createScreenshot(1920, 1080, 'Desktop View', path.join(outputDir, 'desktop-screenshot-1.png'));

    console.log('🎉 All PWA screenshots generated successfully!');
    console.log(`📁 Screenshots saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    process.exit(1);
  }
};

generateScreenshots();