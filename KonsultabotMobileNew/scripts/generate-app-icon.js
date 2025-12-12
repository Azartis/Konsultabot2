/**
 * Generate Holographic Orb App Icon
 * 
 * This script generates an SVG icon based on the HolographicOrb component design.
 * The icon can then be converted to PNG using online tools or ImageMagick.
 * 
 * Usage:
 *   node scripts/generate-app-icon.js
 * 
 * Then convert the SVG to PNG at different sizes:
 *   - icon.png: 1024x1024
 *   - adaptive-icon.png: 1024x1024 (foreground only, transparent background)
 *   - favicon.png: 32x32 or 64x64
 *   - splash-icon.png: 1242x2436 (or your preferred splash size)
 */

const fs = require('fs');
const path = require('path');

// Colors from lumaTheme gradients.orb
const colors = {
  cyan: '#00FFF0',
  blue: '#4F8EFF',
  purple: '#8B5CF6',
  pink: '#FF3B9A',
  white: '#FFFFFF',
  black: '#000000',
};

// Generate SVG icon
function generateIconSVG(size = 1024) {
  const center = size / 2;
  const radius = size * 0.4; // 40% of size for the main orb
  const glowRadius = size * 0.6; // 60% for outer glow
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Outer glow gradient -->
    <radialGradient id="glowGradient" cx="50%" cy="50%">
      <stop offset="0%" stop-color="${colors.cyan}" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="${colors.blue}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.cyan}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Main orb gradient -->
    <radialGradient id="orbGradient" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.cyan}"/>
      <stop offset="30%" stop-color="${colors.blue}"/>
      <stop offset="60%" stop-color="${colors.purple}"/>
      <stop offset="100%" stop-color="${colors.pink}"/>
    </radialGradient>
    
    <!-- Highlight gradient -->
    <radialGradient id="highlightGradient" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.white}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${colors.white}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Glow filter -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background (transparent for adaptive icon, or use color for regular icon) -->
  <rect width="${size}" height="${size}" fill="${colors.black}"/>
  
  <!-- Outer glow -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${glowRadius}" 
    fill="url(#glowGradient)" 
    opacity="0.5"
  />
  
  <!-- Main orb -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${radius}" 
    fill="url(#orbGradient)"
    filter="url(#glow)"
  />
  
  <!-- Inner highlight -->
  <circle 
    cx="${center * 0.7}" 
    cy="${center * 0.7}" 
    r="${radius * 0.4}" 
    fill="url(#highlightGradient)"
  />
  
  <!-- Reflection 1 (bottom right) -->
  <circle 
    cx="${center * 1.15}" 
    cy="${center * 1.2}" 
    r="${radius * 0.25}" 
    fill="${colors.white}" 
    opacity="0.3"
  />
  
  <!-- Reflection 2 (top right) -->
  <circle 
    cx="${center * 1.2}" 
    cy="${center * 0.7}" 
    r="${radius * 0.15}" 
    fill="${colors.white}" 
    opacity="0.2"
  />
  
  <!-- Particles (8 small dots around the orb) -->
  ${Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45) * (Math.PI / 180);
    const particleRadius = radius * 0.7;
    const x = center + Math.cos(angle) * particleRadius;
    const y = center + Math.sin(angle) * particleRadius;
    return `<circle cx="${x}" cy="${y}" r="4" fill="${colors.cyan}" opacity="0.6"/>`;
  }).join('\n  ')}
</svg>`;
}

// Generate adaptive icon (foreground only, no background)
function generateAdaptiveIconSVG(size = 1024) {
  const center = size / 2;
  const radius = size * 0.4;
  const glowRadius = size * 0.6;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glowGradient" cx="50%" cy="50%">
      <stop offset="0%" stop-color="${colors.cyan}" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="${colors.blue}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.cyan}" stop-opacity="0"/>
    </radialGradient>
    
    <radialGradient id="orbGradient" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.cyan}"/>
      <stop offset="30%" stop-color="${colors.blue}"/>
      <stop offset="60%" stop-color="${colors.purple}"/>
      <stop offset="100%" stop-color="${colors.pink}"/>
    </radialGradient>
    
    <radialGradient id="highlightGradient" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.white}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${colors.white}" stop-opacity="0"/>
    </radialGradient>
    
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Outer glow -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${glowRadius}" 
    fill="url(#glowGradient)" 
    opacity="0.5"
  />
  
  <!-- Main orb -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${radius}" 
    fill="url(#orbGradient)"
    filter="url(#glow)"
  />
  
  <!-- Inner highlight -->
  <circle 
    cx="${center * 0.7}" 
    cy="${center * 0.7}" 
    r="${radius * 0.4}" 
    fill="url(#highlightGradient)"
  />
  
  <!-- Reflection 1 -->
  <circle 
    cx="${center * 1.15}" 
    cy="${center * 1.2}" 
    r="${radius * 0.25}" 
    fill="${colors.white}" 
    opacity="0.3"
  />
  
  <!-- Reflection 2 -->
  <circle 
    cx="${center * 1.2}" 
    cy="${center * 0.7}" 
    r="${radius * 0.15}" 
    fill="${colors.white}" 
    opacity="0.2"
  />
  
  <!-- Particles -->
  ${Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45) * (Math.PI / 180);
    const particleRadius = radius * 0.7;
    const x = center + Math.cos(angle) * particleRadius;
    const y = center + Math.sin(angle) * particleRadius;
    return `<circle cx="${x}" cy="${y}" r="4" fill="${colors.cyan}" opacity="0.6"/>`;
  }).join('\n  ')}
</svg>`;
}

// Generate favicon (simpler, smaller design)
function generateFaviconSVG(size = 64) {
  const center = size / 2;
  const radius = size * 0.35;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="orbGradient" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.cyan}"/>
      <stop offset="50%" stop-color="${colors.blue}"/>
      <stop offset="100%" stop-color="${colors.purple}"/>
    </radialGradient>
  </defs>
  
  <rect width="${size}" height="${size}" fill="${colors.black}"/>
  <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#orbGradient)"/>
  <circle cx="${center * 0.7}" cy="${center * 0.7}" r="${radius * 0.3}" fill="${colors.white}" opacity="0.5"/>
</svg>`;
}

// Main execution
function main() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const scriptsDir = path.join(__dirname);
  
  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  // Generate SVG files
  console.log('🎨 Generating holographic orb app icons...\n');
  
  // Generate main icon SVG
  const iconSVG = generateIconSVG(1024);
  fs.writeFileSync(path.join(scriptsDir, 'icon.svg'), iconSVG);
  console.log('✅ Generated icon.svg (1024x1024)');
  
  // Generate adaptive icon SVG
  const adaptiveIconSVG = generateAdaptiveIconSVG(1024);
  fs.writeFileSync(path.join(scriptsDir, 'adaptive-icon.svg'), adaptiveIconSVG);
  console.log('✅ Generated adaptive-icon.svg (1024x1024)');
  
  // Generate favicon SVG
  const faviconSVG = generateFaviconSVG(64);
  fs.writeFileSync(path.join(scriptsDir, 'favicon.svg'), faviconSVG);
  console.log('✅ Generated favicon.svg (64x64)\n');
  
  console.log('📝 Next steps:');
  console.log('1. Open the SVG files in a graphics editor (Inkscape, Figma, or online tool)');
  console.log('2. Export them as PNG at the required sizes:');
  console.log('   - icon.png: 1024x1024');
  console.log('   - adaptive-icon.png: 1024x1024 (foreground only)');
  console.log('   - favicon.png: 32x32 or 64x64');
  console.log('   - splash-icon.png: 1242x2436 (or your preferred size)');
  console.log('3. Place the PNG files in the assets/ directory');
  console.log('\n💡 Tip: You can use online tools like:');
  console.log('   - https://cloudconvert.com/svg-to-png');
  console.log('   - https://convertio.co/svg-png/');
  console.log('   - Or use ImageMagick: convert icon.svg -resize 1024x1024 icon.png');
}

if (require.main === module) {
  main();
}

module.exports = { generateIconSVG, generateAdaptiveIconSVG, generateFaviconSVG };

