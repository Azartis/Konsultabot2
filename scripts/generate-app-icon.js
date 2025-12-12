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

// Generate SVG icon with techy holographic orb
function generateIconSVG(size = 1024) {
  const center = size / 2;
  const radius = size * 0.4; // 40% of size for the main orb
  const glowRadius = size * 0.6; // 60% for outer glow
  
  // Generate hexagon points
  const hexPoints = (cx, cy, r) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(' ');
  };
  
  // Generate circuit lines
  const circuitLines = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const startRadius = radius * 0.85;
    const endRadius = radius * 1.15;
    const x1 = center + Math.cos(angle) * startRadius;
    const y1 = center + Math.sin(angle) * startRadius;
    const x2 = center + Math.cos(angle) * endRadius;
    const y2 = center + Math.sin(angle) * endRadius;
    circuitLines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors.cyan}" stroke-width="2" opacity="0.4" stroke-dasharray="4 4"/>`);
  }
  
  // Generate tech nodes
  const techNodes = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * (Math.PI / 180);
    const nodeRadius = radius * 1.2;
    const x = center + Math.cos(angle) * nodeRadius;
    const y = center + Math.sin(angle) * nodeRadius;
    techNodes.push(`<circle cx="${x}" cy="${y}" r="6" fill="${colors.cyan}" opacity="0.7">
      <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" begin="${i * 0.25}s"/>
    </circle>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Konsultabot Tech Holographic Orb Icon">
  <defs>
    <!-- Dark tech background gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0E1A"/>
      <stop offset="50%" stop-color="#0F1625"/>
      <stop offset="100%" stop-color="#0A0E1A"/>
    </linearGradient>
    
    <!-- Outer glow gradient -->
    <radialGradient id="glowGradient" cx="50%" cy="50%">
      <stop offset="0%" stop-color="${colors.cyan}" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="${colors.blue}" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="${colors.purple}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.cyan}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Main orb gradient with tech colors -->
    <radialGradient id="orbGradient" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.cyan}"/>
      <stop offset="25%" stop-color="${colors.blue}"/>
      <stop offset="50%" stop-color="${colors.purple}"/>
      <stop offset="75%" stop-color="${colors.pink}"/>
      <stop offset="100%" stop-color="#1A1F3A"/>
    </radialGradient>
    
    <!-- Tech highlight gradient -->
    <radialGradient id="highlightGradient" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.white}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${colors.cyan}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${colors.white}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Circuit pattern gradient -->
    <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.cyan}" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="${colors.blue}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${colors.purple}" stop-opacity="0.6"/>
    </linearGradient>
    
    <!-- Enhanced glow filter -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Tech pattern filter -->
    <filter id="techGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Dark tech background -->
  <rect width="${size}" height="${size}" fill="url(#bgGradient)"/>
  
  <!-- Outer hexagonal grid pattern -->
  <g opacity="0.15">
    ${Array.from({ length: 3 }, (_, i) => {
      const hexRadius = radius * (1.1 + i * 0.15);
      const hexPointsStr = hexPoints(center, center, hexRadius);
      return `<polygon points="${hexPointsStr}" fill="none" stroke="${colors.cyan}" stroke-width="2"/>`;
    }).join('\n    ')}
  </g>
  
  <!-- Outer glow -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${glowRadius}" 
    fill="url(#glowGradient)" 
    opacity="0.6"
  />
  
  <!-- Circuit lines radiating from orb -->
  <g filter="url(#techGlow)">
    ${circuitLines.join('\n    ')}
  </g>
  
  <!-- Main orb -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${radius}" 
    fill="url(#orbGradient)"
    filter="url(#glow)"
  />
  
  <!-- Inner hexagonal pattern overlay -->
  <g opacity="0.3">
    ${Array.from({ length: 2 }, (_, i) => {
      const hexRadius = radius * (0.6 - i * 0.2);
      const hexPointsStr = hexPoints(center, center, hexRadius);
      return `<polygon points="${hexPointsStr}" fill="none" stroke="${colors.white}" stroke-width="1.5"/>`;
    }).join('\n    ')}
  </g>
  
  <!-- Inner highlight -->
  <circle 
    cx="${center * 0.7}" 
    cy="${center * 0.7}" 
    r="${radius * 0.4}" 
    fill="url(#highlightGradient)"
  />
  
  <!-- Tech core (smaller inner orb) -->
  <circle 
    cx="${center * 0.75}" 
    cy="${center * 0.75}" 
    r="${radius * 0.25}" 
    fill="${colors.cyan}"
    opacity="0.6"
    filter="url(#techGlow)"
  />
  
  <!-- Data stream lines -->
  <g opacity="0.5" stroke="${colors.cyan}" stroke-width="1.5" fill="none">
    ${Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60) * (Math.PI / 180);
      const startRadius = radius * 0.9;
      const endRadius = radius * 1.05;
      const x1 = center + Math.cos(angle) * startRadius;
      const y1 = center + Math.sin(angle) * startRadius;
      const x2 = center + Math.cos(angle) * endRadius;
      const y2 = center + Math.sin(angle) * endRadius;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join('\n    ')}
  </g>
  
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
  
  <!-- Tech nodes (animated connection points) -->
  <g>
    ${techNodes.join('\n    ')}
  </g>
  
  <!-- Enhanced particles (12 tech particles) -->
  ${Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30) * (Math.PI / 180);
    const particleRadius = radius * 0.75;
    const x = center + Math.cos(angle) * particleRadius;
    const y = center + Math.sin(angle) * particleRadius;
    const color = i % 3 === 0 ? colors.cyan : i % 3 === 1 ? colors.blue : colors.purple;
    return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" opacity="0.7">
      <animate attributeName="r" values="2;5;2" dur="3s" repeatCount="indefinite" begin="${i * 0.25}s"/>
    </circle>`;
  }).join('\n  ')}
  
  <!-- Outer tech ring -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${radius * 1.15}" 
    fill="none"
    stroke="url(#circuitGradient)"
    stroke-width="2"
    opacity="0.4"
    stroke-dasharray="8 4"
  />
</svg>`;
}

// Generate adaptive icon (foreground only, no background) - techy version
function generateAdaptiveIconSVG(size = 1024) {
  const center = size / 2;
  const radius = size * 0.4;
  const glowRadius = size * 0.6;
  
  // Generate hexagon points
  const hexPoints = (cx, cy, r) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(' ');
  };
  
  // Generate circuit lines
  const circuitLines = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const startRadius = radius * 0.85;
    const endRadius = radius * 1.15;
    const x1 = center + Math.cos(angle) * startRadius;
    const y1 = center + Math.sin(angle) * startRadius;
    const x2 = center + Math.cos(angle) * endRadius;
    const y2 = center + Math.sin(angle) * endRadius;
    circuitLines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors.cyan}" stroke-width="2" opacity="0.4" stroke-dasharray="4 4"/>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Konsultabot Tech Holographic Orb Adaptive Icon">
  <defs>
    <!-- Outer glow gradient -->
    <radialGradient id="glowGradientAdaptive" cx="50%" cy="50%">
      <stop offset="0%" stop-color="${colors.cyan}" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="${colors.blue}" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="${colors.purple}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.cyan}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Main orb gradient -->
    <radialGradient id="orbGradientAdaptive" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.cyan}"/>
      <stop offset="25%" stop-color="${colors.blue}"/>
      <stop offset="50%" stop-color="${colors.purple}"/>
      <stop offset="75%" stop-color="${colors.pink}"/>
      <stop offset="100%" stop-color="#1A1F3A"/>
    </radialGradient>
    
    <!-- Tech highlight gradient -->
    <radialGradient id="highlightGradientAdaptive" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.white}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${colors.cyan}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${colors.white}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Circuit pattern gradient -->
    <linearGradient id="circuitGradientAdaptive" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.cyan}" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="${colors.blue}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${colors.purple}" stop-opacity="0.6"/>
    </linearGradient>
    
    <!-- Enhanced glow filter -->
    <filter id="glowAdaptive" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Tech pattern filter -->
    <filter id="techGlowAdaptive">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Outer hexagonal grid pattern -->
  <g opacity="0.15">
    ${Array.from({ length: 3 }, (_, i) => {
      const hexRadius = radius * (1.1 + i * 0.15);
      const hexPointsStr = hexPoints(center, center, hexRadius);
      return `<polygon points="${hexPointsStr}" fill="none" stroke="${colors.cyan}" stroke-width="2"/>`;
    }).join('\n    ')}
  </g>
  
  <!-- Outer glow -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${glowRadius}" 
    fill="url(#glowGradientAdaptive)" 
    opacity="0.6"
  />
  
  <!-- Circuit lines radiating from orb -->
  <g filter="url(#techGlowAdaptive)">
    ${circuitLines.join('\n    ')}
  </g>
  
  <!-- Main orb -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${radius}" 
    fill="url(#orbGradientAdaptive)"
    filter="url(#glowAdaptive)"
  />
  
  <!-- Inner hexagonal pattern overlay -->
  <g opacity="0.3">
    ${Array.from({ length: 2 }, (_, i) => {
      const hexRadius = radius * (0.6 - i * 0.2);
      const hexPointsStr = hexPoints(center, center, hexRadius);
      return `<polygon points="${hexPointsStr}" fill="none" stroke="${colors.white}" stroke-width="1.5"/>`;
    }).join('\n    ')}
  </g>
  
  <!-- Inner highlight -->
  <circle 
    cx="${center * 0.7}" 
    cy="${center * 0.7}" 
    r="${radius * 0.4}" 
    fill="url(#highlightGradientAdaptive)"
  />
  
  <!-- Tech core (smaller inner orb) -->
  <circle 
    cx="${center * 0.75}" 
    cy="${center * 0.75}" 
    r="${radius * 0.25}" 
    fill="${colors.cyan}"
    opacity="0.6"
    filter="url(#techGlowAdaptive)"
  />
  
  <!-- Data stream lines -->
  <g opacity="0.5" stroke="${colors.cyan}" stroke-width="1.5" fill="none">
    ${Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60) * (Math.PI / 180);
      const startRadius = radius * 0.9;
      const endRadius = radius * 1.05;
      const x1 = center + Math.cos(angle) * startRadius;
      const y1 = center + Math.sin(angle) * startRadius;
      const x2 = center + Math.cos(angle) * endRadius;
      const y2 = center + Math.sin(angle) * endRadius;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join('\n    ')}
  </g>
  
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
  
  <!-- Tech nodes (connection points) -->
  ${Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45) * (Math.PI / 180);
    const nodeRadius = radius * 1.2;
    const x = center + Math.cos(angle) * nodeRadius;
    const y = center + Math.sin(angle) * nodeRadius;
    return `<circle cx="${x}" cy="${y}" r="6" fill="${colors.cyan}" opacity="0.7"/>`;
  }).join('\n  ')}
  
  <!-- Enhanced particles (12 tech particles) -->
  ${Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30) * (Math.PI / 180);
    const particleRadius = radius * 0.75;
    const x = center + Math.cos(angle) * particleRadius;
    const y = center + Math.sin(angle) * particleRadius;
    const color = i % 3 === 0 ? colors.cyan : i % 3 === 1 ? colors.blue : colors.purple;
    return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" opacity="0.7"/>`;
  }).join('\n  ')}
  
  <!-- Outer tech ring -->
  <circle 
    cx="${center}" 
    cy="${center}" 
    r="${radius * 1.15}" 
    fill="none"
    stroke="url(#circuitGradientAdaptive)"
    stroke-width="2"
    opacity="0.4"
    stroke-dasharray="8 4"
  />
</svg>`;
}

// Generate favicon (simpler, smaller techy design)
function generateFaviconSVG(size = 64) {
  const center = size / 2;
  const radius = size * 0.35;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Konsultabot Tech Orb Favicon">
  <defs>
    <radialGradient id="orbGradientFavicon" cx="30%" cy="30%">
      <stop offset="0%" stop-color="${colors.cyan}"/>
      <stop offset="50%" stop-color="${colors.blue}"/>
      <stop offset="100%" stop-color="${colors.purple}"/>
    </radialGradient>
    <filter id="glowFavicon">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="${size}" height="${size}" fill="${colors.black}"/>
  <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#orbGradientFavicon)" filter="url(#glowFavicon)"/>
  <circle cx="${center * 0.7}" cy="${center * 0.7}" r="${radius * 0.3}" fill="${colors.white}" opacity="0.6"/>
  <!-- Small tech particles -->
  ${Array.from({ length: 4 }, (_, i) => {
    const angle = (i * 90) * (Math.PI / 180);
    const particleRadius = radius * 0.7;
    const x = center + Math.cos(angle) * particleRadius;
    const y = center + Math.sin(angle) * particleRadius;
    return `<circle cx="${x}" cy="${y}" r="1.5" fill="${colors.cyan}" opacity="0.8"/>`;
  }).join('\n  ')}
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

