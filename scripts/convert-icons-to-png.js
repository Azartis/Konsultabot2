/**
 * Convert SVG Icons to PNG
 * 
 * This script converts the generated SVG icons to PNG format.
 * It uses sharp (if available) or provides instructions for manual conversion.
 * 
 * Usage:
 *   node scripts/convert-icons-to-png.js
 * 
 * Requirements:
 *   - npm install sharp (optional, for automatic conversion)
 *   - Or use online tools/ImageMagick for manual conversion
 */

const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);
const assetsDir = path.join(__dirname, '..', 'assets');

// Icon sizes
const iconSizes = {
  'icon.png': 1024,
  'adaptive-icon.png': 1024,
  'favicon.png': 64,
  'splash-icon.png': 1242, // Width, height will be calculated
};

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
  console.log('✅ Sharp found - using automatic conversion\n');
} catch (e) {
  console.log('⚠️  Sharp not found - will provide manual instructions\n');
  console.log('💡 To enable automatic conversion, run: npm install sharp\n');
}

async function convertWithSharp(svgPath, pngPath, width, height = null) {
  if (!sharp) return false;
  
  try {
    await sharp(svgPath)
      .resize(width, height || width)
      .png()
      .toFile(pngPath);
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${path.basename(svgPath)}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Converting SVG icons to PNG...\n');
  
  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('📁 Created assets directory\n');
  }
  
  let converted = 0;
  let failed = 0;
  
  // Convert main icon
  const iconSvg = path.join(scriptsDir, 'icon.svg');
  const iconPng = path.join(assetsDir, 'icon.png');
  
  if (fs.existsSync(iconSvg)) {
    if (sharp) {
      const success = await convertWithSharp(iconSvg, iconPng, 1024);
      if (success) {
        console.log('✅ Converted icon.svg → icon.png (1024x1024)');
        converted++;
      } else {
        failed++;
      }
    } else {
      console.log('⏭️  Skipping icon.png (use manual conversion)');
    }
  } else {
    console.log('⚠️  icon.svg not found. Run: node scripts/generate-app-icon.js');
  }
  
  // Convert adaptive icon
  const adaptiveSvg = path.join(scriptsDir, 'adaptive-icon.svg');
  const adaptivePng = path.join(assetsDir, 'adaptive-icon.png');
  
  if (fs.existsSync(adaptiveSvg)) {
    if (sharp) {
      const success = await convertWithSharp(adaptiveSvg, adaptivePng, 1024);
      if (success) {
        console.log('✅ Converted adaptive-icon.svg → adaptive-icon.png (1024x1024)');
        converted++;
      } else {
        failed++;
      }
    } else {
      console.log('⏭️  Skipping adaptive-icon.png (use manual conversion)');
    }
  } else {
    console.log('⚠️  adaptive-icon.svg not found. Run: node scripts/generate-app-icon.js');
  }
  
  // Convert favicon
  const faviconSvg = path.join(scriptsDir, 'favicon.svg');
  const faviconPng = path.join(assetsDir, 'favicon.png');
  
  if (fs.existsSync(faviconSvg)) {
    if (sharp) {
      const success = await convertWithSharp(faviconSvg, faviconPng, 64);
      if (success) {
        console.log('✅ Converted favicon.svg → favicon.png (64x64)');
        converted++;
      } else {
        failed++;
      }
    } else {
      console.log('⏭️  Skipping favicon.png (use manual conversion)');
    }
  } else {
    console.log('⚠️  favicon.svg not found. Run: node scripts/generate-app-icon.js');
  }
  
  // Convert splash icon (optional - can use same as icon.png)
  const splashPng = path.join(assetsDir, 'splash-icon.png');
  if (fs.existsSync(iconPng)) {
    if (sharp) {
      try {
        // Create splash from icon (can be customized)
        await sharp(iconPng)
          .resize(1242, 2436, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 1 }
          })
          .png()
          .toFile(splashPng);
        console.log('✅ Created splash-icon.png (1242x2436)');
        converted++;
      } catch (error) {
        console.log('⚠️  Could not create splash-icon.png');
      }
    } else {
      console.log('⏭️  Skipping splash-icon.png (use manual conversion)');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (sharp && converted > 0) {
    console.log(`\n✅ Successfully converted ${converted} icon(s)!`);
    if (failed > 0) {
      console.log(`⚠️  ${failed} conversion(s) failed`);
    }
    console.log('\n📱 Your app icons are ready in the assets/ directory!');
    console.log('💡 To apply the new icons, rebuild your app:');
    console.log('   npx expo prebuild --clean');
    console.log('   npx expo run:android  (or run:ios)');
  } else if (!sharp) {
    console.log('\n📝 Manual Conversion Instructions:');
    console.log('\n1. Online Tools (Easiest):');
    console.log('   - Go to https://cloudconvert.com/svg-to-png');
    console.log('   - Upload each SVG file from scripts/ directory');
    console.log('   - Set size:');
    console.log('     * icon.svg → 1024x1024 → save as assets/icon.png');
    console.log('     * adaptive-icon.svg → 1024x1024 → save as assets/adaptive-icon.png');
    console.log('     * favicon.svg → 64x64 → save as assets/favicon.png');
    console.log('\n2. ImageMagick (Command Line):');
    console.log('   convert scripts/icon.svg -resize 1024x1024 assets/icon.png');
    console.log('   convert scripts/adaptive-icon.svg -resize 1024x1024 assets/adaptive-icon.png');
    console.log('   convert scripts/favicon.svg -resize 64x64 assets/favicon.png');
    console.log('\n3. Graphics Editor:');
    console.log('   - Open SVG in Inkscape/Figma/Illustrator');
    console.log('   - Export as PNG at required sizes');
    console.log('   - Save to assets/ directory');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertWithSharp };

