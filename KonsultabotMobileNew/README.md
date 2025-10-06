# 🤖 KonsultaBot - EVSU Dulag AI Assistant

**Multi-language AI chatbot for EVSU Dulag Campus students with offline capabilities**

[![Deploy Status](https://img.shields.io/badge/Deploy-Ready-brightgreen)]()
[![Languages](https://img.shields.io/badge/Languages-4-blue)]()
[![Offline](https://img.shields.io/badge/Offline-Supported-orange)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-purple)]()

---

## 🌟 **Features**

### 🗣️ **Multi-Language Support**
- **English**: Full conversational support
- **Bisaya (Cebuano)**: Native language patterns and responses
- **Waray**: Regional language support for Leyte students
- **Tagalog**: Filipino national language support

### 📱 **Mobile-First Design**
- **Progressive Web App (PWA)**: Installable on any phone
- **Responsive UI**: Optimized for mobile screens
- **Touch-Friendly**: Easy navigation and interaction
- **Cross-Platform**: Works on iOS, Android, and desktop

### 🔌 **Offline Capabilities**
- **Service Worker**: Caches app for offline use
- **Offline Responses**: Basic campus info without internet
- **Smart Fallback**: Graceful degradation when network fails
- **Local Storage**: Saves user preferences offline

### 🌐 **Network Adaptive**
- **Auto-Discovery**: Finds backend server automatically
- **Multiple IP Support**: Works across different networks
- **Tunnel Support**: Global access via tunneling
- **CORS Configured**: Cross-origin requests handled

---

## 🚀 **Quick Start**

### **For Deployment:**
```bash
# 1. Build the app
npm run build:web

# 2. Deploy to Netlify (easiest)
# - Go to netlify.com
# - Drag & drop 'dist' folder
# - Get your live URL!

# Alternative: Use deployment script
deploy.bat
```

### **For Development:**
```bash
# Install dependencies
npm install

# Start development server
npm start

# Start with tunnel (global access)
npx expo start --web --tunnel
```

---

## 📁 **Project Structure**

```
KonsultabotMobileNew/
├── src/
│   ├── screens/           # App screens
│   │   ├── auth/         # Login/Register
│   │   └── main/         # Chat interface
│   ├── services/         # API and offline services
│   ├── context/          # React context providers
│   ├── navigation/       # App navigation
│   └── theme/           # UI theme and styling
├── public/
│   ├── manifest.json    # PWA configuration
│   └── service-worker.js # Offline support
├── dist/                # Built app (after npm run build:web)
├── deploy.bat          # Deployment script
└── generate-qr.html    # QR code generator
```

---

## 🛠️ **Configuration**

### **API Configuration** (`src/services/apiService.js`)
```javascript
// Automatically detects network and configures API endpoints
const possibleIPs = [
  '192.168.1.17',    // Home networks
  '192.168.0.100',   // Office networks
  '10.0.0.100',      // Corporate networks
  '192.168.110.106'  // Current detected IP
];
```

### **Offline Responses** (Built-in)
- Campus information in all 4 languages
- Course and program details
- Library and facility information
- Technical support basics

---

## 🌍 **Deployment Options**

### **1. Netlify (Recommended)**
- ✅ **Free hosting**
- ✅ **Instant deployment**
- ✅ **Global CDN**
- ✅ **HTTPS included**

### **2. Vercel**
- ✅ **Fast deployment**
- ✅ **Automatic builds**
- ✅ **Edge network**

### **3. GitHub Pages**
- ✅ **Free for public repos**
- ✅ **Git integration**
- ✅ **Custom domains**

### **4. Local Network**
- ✅ **Instant sharing**
- ✅ **No signup required**
- ✅ **Tunnel support**

---

## 📱 **User Experience**

### **First Visit:**
1. User opens URL on any phone
2. App loads and caches for offline use
3. Can install as mobile app ("Add to Home Screen")
4. Works immediately with or without internet

### **Offline Mode:**
- All UI functionality available
- Basic campus information accessible
- Multi-language responses work
- Graceful "offline" indicators

### **Multi-Language Detection:**
```javascript
// Automatic language detection
"Kumusta! Unsa ang mga kurso?" → Detected: Bisaya
"Maupay nga kulop! Hain an library?" → Detected: Waray
"What programs are available?" → Detected: English
```

---

## 🧪 **Testing**

### **Test Scenarios:**
```bash
# Run deployment test
test-deployment.bat

# Test different networks
# - Home WiFi
# - Mobile data
# - Public WiFi
# - Offline mode

# Test languages
# - English queries
# - Bisaya phrases
# - Waray questions
# - Tagalog conversations
```

### **Browser Compatibility:**
- ✅ Chrome (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Firefox (All platforms)
- ✅ Edge (Windows)
- ✅ Samsung Internet (Android)

---

## 🎯 **Use Cases**

### **For Students:**
- **Campus Information**: Programs, schedules, facilities
- **Technical Support**: Printer, WiFi, computer issues
- **Multi-language Help**: Ask in preferred language
- **Offline Access**: Works without internet

### **For Administrators:**
- **24/7 Availability**: Always accessible
- **Reduced Support Load**: Handles common queries
- **Multi-language Support**: Serves diverse student body
- **Analytics Ready**: Track usage patterns

---

## 🔧 **Customization**

### **Adding New Languages:**
1. Update `language_processor.py` (backend)
2. Add patterns to `apiService.js` (frontend)
3. Include offline responses
4. Test with native speakers

### **Modifying Responses:**
1. Edit offline responses in `apiService.js`
2. Update backend knowledge base
3. Test across all languages
4. Deploy updates

---

## 📊 **Performance**

### **Load Times:**
- **First Visit**: ~2-3 seconds
- **Cached Visit**: ~0.5 seconds
- **Offline Mode**: Instant

### **Bundle Size:**
- **Main Bundle**: ~1.87 MB
- **Cached Assets**: ~2.5 MB total
- **Offline Storage**: ~5 MB

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**App won't load:**
- Check internet connection
- Try incognito/private mode
- Clear browser cache

**Offline mode not working:**
- Visit app online first
- Wait for caching to complete
- Check service worker registration

**Language detection issues:**
- Use more specific phrases
- Try manual language selection
- Check for typos in local languages

---

## 🤝 **Contributing**

### **Development Setup:**
```bash
git clone [repository]
cd KonsultabotMobileNew
npm install
npm start
```

### **Adding Features:**
1. Create feature branch
2. Implement changes
3. Test across languages
4. Update documentation
5. Submit pull request

---

## 📄 **License**

Educational use for EVSU Dulag Campus.

---

## 📞 **Support**

- **Technical Issues**: Check troubleshooting guide
- **Feature Requests**: Submit via GitHub issues
- **Campus Integration**: Contact EVSU IT Department

---

**🎉 KonsultaBot - Making campus information accessible to everyone, everywhere, in every language!**
