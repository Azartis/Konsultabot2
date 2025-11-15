# 📱 Mobile Setup with Expo Go - Complete Guide

## ✅ Voice Features Added!

**Microphone button is now back!** 🎤

- ✅ Voice recording with microphone button
- ✅ Visual feedback when recording (red stop button)
- ✅ Permission requests for microphone access
- ✅ Ready for speech-to-text integration

---

## 📱 **How to Run on Mobile with Expo Go**

### **Step 1: Find Your Computer's IP Address**

**On Windows:**
```powershell
# Open PowerShell or Command Prompt
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.17
```

**Quick way:**
```powershell
# Run this command
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
```

---

### **Step 2: Update API Configuration**

**Edit this file:**
```
KonsultabotMobileNew/src/services/apiService.js
```

**Find line 23 and update:**
```javascript
// BEFORE (only works for web and Android emulator):
baseURL: Platform.OS === 'web' ? 'http://localhost:8000/api' : 'http://10.0.2.2:8000/api',

// AFTER (works for real devices on same WiFi):
baseURL: Platform.OS === 'web' 
  ? 'http://localhost:8000/api' 
  : 'http://192.168.1.X:8000/api',  // ← Replace X with your IP!
```

**Example:**
```javascript
baseURL: Platform.OS === 'web' 
  ? 'http://localhost:8000/api' 
  : 'http://192.168.1.17:8000/api',  // My computer's IP
```

---

### **Step 3: Start Backend Server**

```powershell
# Navigate to backend folder
cd c:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj\backend

# Start Django server on all network interfaces
python manage.py runserver 0.0.0.0:8000
```

**⚠️ Important:** Use `0.0.0.0:8000` not just `8000`
- This makes the server accessible from your phone!

---

### **Step 4: Start Expo Dev Server**

```powershell
# Navigate to mobile app folder
cd c:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj\KonsultabotMobileNew

# Start Expo
npx expo start
```

**You'll see:**
```
› Metro waiting on exp://192.168.1.X:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

### **Step 5: Connect with Expo Go**

**On your phone:**

1. **Install Expo Go** from Play Store / App Store
2. **Make sure phone is on SAME WiFi** as computer
3. **Open Expo Go app**
4. **Scan QR code** from terminal

**App will load on your phone!** 🎉

---

## 🎤 **Testing Voice Features on Mobile**

### **Step 1: Grant Microphone Permission**

When you first tap the microphone button:
- App will ask for microphone permission
- Tap "Allow" or "OK"

### **Step 2: Use Voice Recording**

1. **Tap microphone icon** (🎤) - turns red
2. **Speak your message**
3. **Tap stop icon** (⏹️) - recording stops
4. You'll see a notification

**Note:** Full speech-to-text coming soon! For now, it records and confirms.

---

## 🔧 **Troubleshooting**

### **Issue 1: Can't Connect to Backend**

**Error:** `Network Error` or `Timeout`

**Solution:**
```
1. Check phone and computer on SAME WiFi
2. Verify IP address is correct
3. Restart backend with: python manage.py runserver 0.0.0.0:8000
4. Check firewall settings (Windows Defender may block)
```

**Allow through firewall:**
```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Django Dev Server" dir=in action=allow protocol=TCP localport=8000
```

---

### **Issue 2: App Shows Offline Mode**

**Symptoms:**
- Header shows "📴 No Internet"
- Uses Knowledge Base only

**Solution:**
```
1. Update apiService.js with correct IP
2. Restart Expo: Ctrl+C then npx expo start
3. Check backend is running on 0.0.0.0:8000
4. Test backend: http://YOUR_IP:8000/api/health/
```

---

### **Issue 3: Microphone Permission Denied**

**Solution:**
```
1. Go to phone Settings
2. Apps → Expo Go
3. Permissions → Microphone
4. Enable
5. Restart Expo Go
```

---

### **Issue 4: QR Code Won't Scan**

**Solution:**
```
1. Make sure Expo Go app is updated
2. Try manual connection:
   - In Expo Go, tap "Enter URL manually"
   - Type: exp://192.168.1.X:8081
   - Replace X with your IP
```

---

## 📋 **Quick Start Checklist**

```
□ Found computer's IP address (ipconfig)
□ Updated apiService.js with IP
□ Backend running: python manage.py runserver 0.0.0.0:8000
□ Backend accessible: http://YOUR_IP:8000/api/health/
□ Expo running: npx expo start
□ Phone on same WiFi as computer
□ Expo Go app installed on phone
□ QR code scanned
□ App loaded on phone
□ Microphone permission granted
```

---

## 🎯 **What Works on Mobile Now**

### **✅ Fully Functional:**
- 🌐 Online mode (Gemini + Knowledge Base)
- 📴 Offline mode (Local KB)
- 🎤 Voice recording button
- 📱 Touch interface optimized
- 🔄 Auto network detection
- 💬 Chat history
- ✨ All visual effects (orb, stars)

### **🚧 Coming Soon:**
- 🎙️ Speech-to-text conversion
- 🔊 Text-to-speech responses
- 📤 Share conversations
- 📥 Export chat history

---

## 🔍 **Verify It's Working**

### **Test 1: Backend Connection**

**On your phone's browser:**
```
Open: http://192.168.1.X:8000/api/health/
Should show: {"status": "healthy"}
```

### **Test 2: App Online Mode**

**In the app:**
1. Check header shows "🌐 Online"
2. Send message: "Hello"
3. Should get AI response (not KB)

### **Test 3: Voice Recording**

**In the app:**
1. Tap microphone button 🎤
2. Allow permission
3. Button turns red with stop icon
4. Speak something
5. Tap stop
6. See confirmation message

---

## 🌐 **Network Configuration**

### **Your Setup:**
```
Computer IP: 192.168.1.X    ← Find this with ipconfig
Backend Port: 8000
Expo Port: 8081
```

### **URLs to Remember:**
```
Backend API: http://192.168.1.X:8000/api
Backend Health: http://192.168.1.X:8000/api/health/
Expo Metro: exp://192.168.1.X:8081
```

---

## 💡 **Pro Tips**

### **Tip 1: Keep Terminal Open**
- Don't close backend terminal
- Don't close Expo terminal
- Both needed for app to work

### **Tip 2: Restart If Issues**
```powershell
# Stop everything (Ctrl+C on both terminals)
# Then restart in order:

# Terminal 1: Backend
cd backend
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Expo
cd KonsultabotMobileNew
npx expo start --clear
```

### **Tip 3: Check Phone Battery**
- Expo Go can drain battery quickly
- Keep phone charged while testing

### **Tip 4: Network Stability**
- Stay close to WiFi router
- Weak signal = slow/disconnected

---

## 🚀 **Quick Commands**

### **Start Everything:**
```powershell
# Terminal 1
cd c:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj\backend
python manage.py runserver 0.0.0.0:8000

# Terminal 2  
cd c:\Users\Ace Ziegfred Culapas\CascadeProjects\CapProj\KonsultabotMobileNew
npx expo start
```

### **Check IP:**
```powershell
ipconfig | findstr IPv4
```

### **Test Backend:**
```powershell
curl http://localhost:8000/api/health/
```

---

## 📱 **Expected Mobile Experience**

### **Startup:**
```
1. App loads with starry background
2. Holographic orb animates
3. Welcome screen or Login screen
4. Header shows network status
```

### **Chat Interface:**
```
1. Messages scroll smoothly
2. Suggestions carousel swipes
3. Input field responsive
4. Microphone button visible 🎤
5. Send button functional
```

### **Voice Recording:**
```
1. Tap mic → permission request
2. Allow → button turns red
3. Recording indicator active
4. Tap stop → confirmation shown
```

---

## ✅ **Success Indicators**

**You'll know it's working when:**

```
✅ App loads on phone
✅ Header shows "🌐 Online"
✅ Send message gets AI response
✅ Microphone button appears
✅ Can tap and record voice
✅ Smooth animations
✅ No error messages
```

---

## 🎓 **Summary**

**What we fixed:**
1. ✅ Added voice recording functionality
2. ✅ Microphone button visible
3. ✅ Permission handling
4. ✅ Mobile-ready interface

**What you need to do:**
1. Find your IP with `ipconfig`
2. Update `apiService.js` with IP
3. Start backend with `0.0.0.0:8000`
4. Start Expo
5. Scan QR code with Expo Go

**Result:**
- 📱 Fully functional mobile app
- 🎤 Voice recording working
- 🌐 Connected to backend
- ✨ Beautiful interface

---

**You're ready to run on mobile!** 🚀📱

**Need help? Check the troubleshooting section above!** 🔧
