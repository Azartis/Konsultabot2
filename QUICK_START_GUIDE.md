# ⚡ **KonsultaBot Quick Start Guide**

## 🚀 **Get Your AI Platform Running in 5 Minutes**

---

## 📋 **Prerequisites**
- ✅ Python 3.8+ installed
- ✅ Node.js 16+ installed  
- ✅ Git installed
- ✅ Code editor (VS Code recommended)

---

## 🎯 **Step 1: Backend Setup (2 minutes)**

### **Navigate to Django Project**
```bash
cd backend/django_konsultabot
```

### **One-Command Setup**
```bash
python start_konsultabot_server.py
```

**This automatically:**
- ✅ Installs missing Python packages
- ✅ Creates .env file from template
- ✅ Sets up database and runs migrations
- ✅ Creates admin user (admin/admin123)
- ✅ Tests AI services
- ✅ Starts server on http://localhost:8000

### **Manual Setup (if needed)**
```bash
# Install dependencies
pip install -r requirements.txt

# Create environment file
copy env_example.txt .env

# Setup database
python manage.py migrate

# Start server
python manage.py runserver 0.0.0.0:8000
```

---

## 📱 **Step 2: Mobile App Setup (2 minutes)**

### **Navigate to React Native Project**
```bash
cd KonsultabotMobileNew
```

### **Install and Start**
```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### **Test on Device**
- 📱 **Physical Device**: Scan QR code with Expo Go app
- 💻 **Simulator**: Press 'i' for iOS or 'a' for Android
- 🌐 **Web**: Press 'w' for web browser

---

## 🔧 **Step 3: Configuration (1 minute)**

### **Update Mobile App API URL**
Edit `screens/AdvancedChatScreen.js`:
```javascript
// Find your local IP address (ipconfig on Windows, ifconfig on Mac/Linux)
const API_BASE_URL = 'http://YOUR_LOCAL_IP:8000/api/v1/chat';

// Example:
const API_BASE_URL = 'http://192.168.1.17:8000/api/v1/chat';
```

### **Set Your Gemini API Key**
Edit `.env` file in Django project:
```bash
GOOGLE_API_KEY=AIzaSyBRynLqVFbj1jZfAAzqIfLH6xL4rt6483U
```

---

## ✅ **Step 4: Test Everything**

### **Backend Health Check**
Visit: http://localhost:8000/api/v1/chat/health/

Should return:
```json
{
  "status": "healthy",
  "database": {"connected": true},
  "network": {"connected": true},
  "ai_services": {"gemini_available": false, "local_ai_available": true}
}
```

### **Admin Dashboard**
Visit: http://localhost:8000/dashboard/
- Username: `admin`
- Password: `admin123`

### **Mobile App Test**
1. Open app on device/simulator
2. Tap microphone button
3. Say "My WiFi is not working"
4. Should get intelligent response even without Gemini API

---

## 🎯 **Access Points**

| Service | URL | Purpose |
|---------|-----|---------|
| 🤖 **Chat API** | http://localhost:8000/api/v1/chat/ | Main AI endpoint |
| 📊 **Dashboard** | http://localhost:8000/dashboard/ | Analytics dashboard |
| 🔧 **Admin** | http://localhost:8000/admin/ | Django admin |
| 🏥 **Health** | http://localhost:8000/api/v1/chat/health/ | System status |
| 📱 **Mobile** | Expo Dev Server | React Native app |

---

## 🧪 **Quick Tests**

### **Test Voice Interface**
1. Open mobile app
2. Tap microphone button
3. Say: "How do I fix my printer?"
4. Should transcribe and respond with printer troubleshooting

### **Test Multilingual Support**
1. Change language to Tagalog in app
2. Type: "Hindi gumagana ang WiFi ko"
3. Should respond in Tagalog with WiFi help

### **Test Offline Mode**
1. Disconnect internet
2. Ask: "Computer is slow"
3. Should still provide helpful local response

### **Test Analytics**
1. Visit dashboard: http://localhost:8000/dashboard/
2. Should show real-time query statistics
3. Charts should update with your test queries

---

## 🔧 **Troubleshooting**

### **Backend Issues**
```bash
# Check if server is running
curl http://localhost:8000/api/v1/chat/health/

# View server logs
python manage.py runserver --verbosity=2

# Reset database if needed
python manage.py flush
python manage.py migrate
```

### **Mobile App Issues**
```bash
# Clear Expo cache
npx expo start --clear

# Check network connection
# Ensure mobile device and computer are on same WiFi

# Update API URL in AdvancedChatScreen.js
# Use your computer's IP address, not localhost
```

### **Common Fixes**
- **Port 8000 in use**: Change to different port in Django settings
- **Mobile can't connect**: Use computer's IP address, not localhost
- **Gemini API errors**: System automatically uses local responses
- **Voice not working**: Grant microphone permissions on mobile device

---

## 🎉 **You're Ready!**

Your KonsultaBot Advanced AI Platform is now running with:

✅ **Intelligent AI responses** (works without Gemini API)
✅ **Voice interface** (speech-to-text and text-to-speech)
✅ **Multilingual support** (5 languages)
✅ **Offline functionality** (local knowledge base)
✅ **Real-time analytics** (professional dashboard)
✅ **Modern mobile app** (React Native interface)

---

## 📞 **Need Help?**

- 📖 **Full Guide**: See `KONSULTABOT_DEPLOYMENT_GUIDE.md`
- 🎓 **Project Summary**: See `FINAL_PROJECT_SUMMARY.md`
- 🔧 **API Docs**: Visit http://localhost:8000/api/v1/chat/health/
- 💬 **Test Chat**: Use the mobile app or dashboard

**🚀 Your advanced AI platform is ready for demonstration and deployment!**
