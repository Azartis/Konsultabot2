# 🎨 Holographic Orb App Icon Generation Guide

This guide will help you create app icons based on the Holographic Orb design.

## 🚀 Quick Start

1. **Generate SVG files:**
   ```bash
   node scripts/generate-app-icon.js
   ```

2. **Convert SVG to PNG:**
   - Use an online converter (recommended for beginners)
   - Or use ImageMagick (for advanced users)

3. **Place PNG files in `assets/` directory**

## 📐 Required Icon Sizes

| File | Size | Description |
|------|------|-------------|
| `icon.png` | 1024x1024 | Main app icon |
| `adaptive-icon.png` | 1024x1024 | Android adaptive icon (foreground only) |
| `favicon.png` | 32x32 or 64x64 | Web favicon |
| `splash-icon.png` | 1242x2436 | Splash screen (or your preferred size) |

## 🎨 Icon Design

The icon is based on the Holographic Orb component with:
- **Colors**: Cyan (#00FFF0), Blue (#4F8EFF), Purple (#8B5CF6), Pink (#FF3B9A)
- **Design**: Circular orb with gradient, glow, highlights, and particles
- **Style**: Holographic/futuristic aesthetic

## 🔧 Method 1: Online Converter (Easiest)

1. Run the generation script:
   ```bash
   node scripts/generate-app-icon.js
   ```

2. Go to an online SVG to PNG converter:
   - [CloudConvert](https://cloudconvert.com/svg-to-png)
   - [Convertio](https://convertio.co/svg-png/)
   - [SVG2PNG](https://svgtopng.com/)

3. Upload each SVG file and convert:
   - `icon.svg` → `icon.png` (1024x1024)
   - `adaptive-icon.svg` → `adaptive-icon.png` (1024x1024)
   - `favicon.svg` → `favicon.png` (64x64)

4. Download and place in `assets/` directory

## 🔧 Method 2: ImageMagick (Advanced)

If you have ImageMagick installed:

```bash
# Install ImageMagick first (if not installed)
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Convert icons
convert scripts/icon.svg -resize 1024x1024 assets/icon.png
convert scripts/adaptive-icon.svg -resize 1024x1024 assets/adaptive-icon.png
convert scripts/favicon.svg -resize 64x64 assets/favicon.png

# For splash screen (optional, adjust size as needed)
convert scripts/icon.svg -resize 1242x2436 assets/splash-icon.png
```

## 🔧 Method 3: Graphics Editor (Most Control)

1. **Open in Inkscape (Free)**:
   - Download: https://inkscape.org/
   - Open the SVG files
   - File → Export PNG Image
   - Set size and export

2. **Open in Figma (Free, Web-based)**:
   - Upload SVG to Figma
   - Select the design
   - Export as PNG at required sizes

3. **Open in Adobe Illustrator**:
   - Open SVG
   - File → Export → Export As → PNG
   - Set dimensions and export

## 📱 Android Adaptive Icon

For Android adaptive icons:
- The `adaptive-icon.png` should have a transparent background
- The icon will be displayed on a colored background (set in `app.config.js`)
- Current background color: `#FFFFFF` (white)

To change the background color, edit `app.config.js`:
```javascript
android: {
  adaptiveIcon: {
    foregroundImage: "./assets/adaptive-icon.png",
    backgroundColor: "#000000" // Change to your preferred color
  }
}
```

## ✅ Verification

After generating icons:

1. **Check file sizes**:
   ```bash
   ls -lh assets/*.png
   ```

2. **Test in app**:
   ```bash
   npx expo start
   ```

3. **Rebuild if needed**:
   ```bash
   npx expo prebuild --clean
   npx expo run:android
   ```

## 🎨 Customization

To customize the icon colors, edit `scripts/generate-app-icon.js`:

```javascript
const colors = {
  cyan: '#00FFF0',    // Change these
  blue: '#4F8EFF',    // to match
  purple: '#8B5CF6',  // your brand
  pink: '#FF3B9A',    // colors
};
```

Then regenerate the SVG files.

## 📝 Notes

- The icon uses the same gradient colors as the HolographicOrb component
- For best results, use PNG format with transparency where needed
- Android adaptive icons should have padding (the script handles this)
- iOS icons are automatically generated from the main icon.png

## 🐛 Troubleshooting

**Icons not showing up?**
- Make sure files are in `assets/` directory
- Check file names match `app.config.js`
- Rebuild the app: `npx expo prebuild --clean`

**Icons look blurry?**
- Ensure you're using the correct sizes (1024x1024 for main icons)
- Use high-quality PNG export settings
- Avoid resizing smaller icons up

**Colors look different?**
- Check that your graphics editor preserves colors correctly
- Some converters may alter colors slightly
- Try a different converter or editor

## 🎉 Done!

Once you've generated and placed all PNG files in the `assets/` directory, your app will use the holographic orb icon!

