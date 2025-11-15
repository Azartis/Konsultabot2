# 🎓 KonsultaBot Capstone Project - Complete Deployment Guide

## 📋 **Project Overview**

**KonsultaBot: IT Technical Program Solutions for EVSU Dulag Campus**

A mobile-based, voice-enabled AI assistant that helps students and faculty troubleshoot IT issues using:
- 🧠 **AI Integration**: Google Gemini API with intelligent local fallback
- 📱 **Mobile App**: React Native with modern UI/UX
- 🗄️ **Backend**: Python Flask with SQLite database
- 🎤 **Voice Support**: Speech recognition and text-to-speech
- 📊 **Analytics**: Real-time performance tracking
- 🔄 **Offline Mode**: Smart synchronization when network returns

---

## 🚀 **Quick Start (5 Minutes)**

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- Android Studio or Expo Go app
- Google AI Studio API key

### 1. Clone and Setup Backend
```bash
cd CapProj
pip install -r requirements.txt
```

### 2. Configure Environment
Create `.env` file:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=False
```

### 3. Start Backend Server
```bash
python backend/api/enhanced_chat_api.py
```

### 4. Setup Mobile App
```bash
cd KonsultabotMobileNew
npm install
npx expo start
```

### 5. Test the System
- Open Expo Go app and scan QR code
- Ask: "My WiFi is not working"
- Verify both online and offline responses

---

## 🏗️ **Detailed Installation Guide**

### **Backend Setup**

#### 1. Python Environment
```bash
# Create virtual environment
python -m venv konsultabot_env

# Activate environment
# Windows:
konsultabot_env\Scripts\activate
# Linux/Mac:
source konsultabot_env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 2. Database Initialization
```bash
# Initialize SQLite database
python database.py

# Verify tables created
sqlite3 konsultabot.db ".tables"
```

#### 3. API Key Configuration
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to `.env` file:
```env
GOOGLE_API_KEY=AIza...your_key_here
```

#### 4. Test Backend Components
```bash
# Test Gemini integration
python test_gemini.py

# Test network detection
python -c "from network_detector import NetworkDetector; nd = NetworkDetector(); print('Connected:', nd.check_internet_connection())"

# Test analytics
python -c "from analytics_dashboard import KonsultaBotAnalytics; analytics = KonsultaBotAnalytics(); print('Analytics initialized')"
```

### **Mobile App Setup**

#### 1. Install Dependencies
```bash
cd KonsultabotMobileNew
npm install

# Install Expo CLI globally (if not installed)
npm install -g @expo/cli
```

#### 2. Configure App Settings
Update `src/config/apiConfig.js`:
```javascript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_IP_ADDRESS:8000',
  ENDPOINTS: {
    CHAT: '/api/chat',
    FEEDBACK: '/api/feedback',
    HEALTH: '/api/health'
  }
};
```

#### 3. Start Development Server
```bash
# Start Expo development server
npx expo start

# For specific platform
npx expo start --android
npx expo start --ios
```

---

## 🔧 **System Architecture**

### **Backend Components**

```
backend/
├── api/
│   └── enhanced_chat_api.py      # Main API server
├── chat/
│   └── technical_knowledge.py    # Knowledge base
├── chatbot_core.py               # Core logic with fallback
├── gemini_helper.py              # AI integration
├── network_detector.py           # Connectivity monitoring
├── analytics_dashboard.py        # Performance tracking
└── konsultabot.db               # SQLite database
```

### **Mobile App Structure**

```
KonsultabotMobileNew/
├── src/
│   ├── screens/
│   │   ├── main/
│   │   │   ├── EnhancedChatScreen.js    # Modern chat interface
│   │   │   └── OnboardingScreen.js      # User onboarding
│   │   └── auth/                        # Authentication
│   ├── services/
│   │   └── apiService.js               # API communication
│   ├── theme/
│   │   └── cleanTheme.js               # UI theme
│   └── context/
│       └── AuthContext.js              # User management
└── App.js                              # Main app component
```

### **Data Flow**

1. **User Input** → Mobile App
2. **API Request** → Backend Server
3. **Network Check** → Online/Offline Decision
4. **AI Processing** → Gemini API or Local Intelligence
5. **Response** → Mobile App
6. **Analytics** → Performance Tracking
7. **Feedback Loop** → Continuous Improvement

---

## 📊 **Features Overview**

### **✅ Implemented Features**

#### **Core Functionality**
- ✅ **Hybrid AI System**: Gemini API with intelligent local fallback
- ✅ **Voice Integration**: Speech-to-text and text-to-speech
- ✅ **Multi-language Support**: English, Bisaya, Waray, Tagalog
- ✅ **Offline Mode**: Smart local responses for common IT issues
- ✅ **Real-time Analytics**: Performance and usage tracking

#### **Mobile App Features**
- ✅ **Modern UI**: Clean, intuitive chat interface
- ✅ **User Onboarding**: Step-by-step introduction
- ✅ **Quick Actions**: Common IT issue shortcuts
- ✅ **Connection Status**: Online/offline indicators
- ✅ **Typing Indicators**: Real-time conversation feedback

#### **Backend Features**
- ✅ **RESTful API**: Clean, documented endpoints
- ✅ **Rate Limiting**: Prevents abuse and ensures stability
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Logging**: Detailed request/response tracking
- ✅ **Health Monitoring**: System status endpoints

#### **Analytics & Monitoring**
- ✅ **Usage Statistics**: Query counts and patterns
- ✅ **Performance Metrics**: Response times and success rates
- ✅ **User Satisfaction**: Feedback collection and analysis
- ✅ **System Health**: Component status monitoring

### **🎯 Key Improvements Made**

#### **Gemini API Issues Fixed**
- ✅ **Multiple Model Support**: Tries different Gemini models automatically
- ✅ **Graceful Fallback**: Seamless switch to local intelligence
- ✅ **Error Recovery**: Handles API failures without breaking user experience
- ✅ **Smart Responses**: Keyword-based intelligent local responses

#### **Enhanced User Experience**
- ✅ **Modern Design**: Professional, accessible interface
- ✅ **Voice Feedback**: Audio responses for accessibility
- ✅ **Quick Solutions**: Instant help for common issues
- ✅ **Status Awareness**: Clear online/offline indicators

#### **Robust Architecture**
- ✅ **Service-based Design**: Modular, maintainable code
- ✅ **Comprehensive Logging**: Detailed debugging information
- ✅ **Analytics Integration**: Built-in performance tracking
- ✅ **Scalable Structure**: Easy to extend and modify

---

## 🧪 **Testing Guide**

### **Backend Testing**

#### 1. API Health Check
```bash
curl http://localhost:8000/api/health
```
Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "network_status": "online",
  "version": "2.0.0"
}
```

#### 2. Chat Functionality
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My WiFi is not working", "language": "english"}'
```

#### 3. Analytics Summary
```bash
curl http://localhost:8000/api/analytics/summary?days=7
```

### **Mobile App Testing**

#### 1. Basic Functionality
- ✅ App launches without crashes
- ✅ Onboarding screens display correctly
- ✅ Chat interface loads properly
- ✅ Voice input works (with permissions)

#### 2. Network Scenarios
- ✅ **Online Mode**: Gemini AI responses (when API works)
- ✅ **Offline Mode**: Local intelligent responses
- ✅ **Network Switching**: Seamless mode transitions

#### 3. Common Use Cases
- ✅ "WiFi not working" → Network troubleshooting steps
- ✅ "Printer issues" → Printer troubleshooting guide
- ✅ "Computer slow" → Performance optimization tips
- ✅ "MS Office help" → Office application support

### **Integration Testing**

#### 1. End-to-End Flow
1. Start backend server
2. Launch mobile app
3. Send test message
4. Verify response received
5. Check analytics logged
6. Test feedback submission

#### 2. Offline Synchronization
1. Disconnect internet
2. Send messages (should queue)
3. Reconnect internet
4. Verify messages sync automatically

---

## 📈 **Analytics & Monitoring**

### **Admin Dashboard**

Access analytics at: `http://localhost:8000/api/analytics/summary`

#### **Key Metrics Tracked**
- **Usage Statistics**: Total queries, daily trends
- **Performance**: Response times, success rates
- **User Satisfaction**: Ratings and feedback
- **System Health**: Component status, uptime

#### **Generate Reports**
```python
from analytics_dashboard import KonsultaBotAnalytics

analytics = KonsultaBotAnalytics()
report_path = analytics.generate_report(days=30)
print(f"Report generated: {report_path}")
```

### **Monitoring Endpoints**

#### System Status
```bash
GET /api/system/status
```

#### Performance Metrics
```bash
GET /api/analytics/summary?days=30
```

#### Health Check
```bash
GET /api/health
```

---

## 🚀 **Production Deployment**

### **Server Requirements**
- **OS**: Ubuntu 20.04+ or Windows Server 2019+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB minimum
- **Network**: Stable internet connection

### **Production Setup**

#### 1. Server Configuration
```bash
# Install Python and dependencies
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx

# Create application directory
sudo mkdir /opt/konsultabot
sudo chown $USER:$USER /opt/konsultabot
```

#### 2. Application Deployment
```bash
# Clone repository
cd /opt/konsultabot
git clone <your-repo-url> .

# Setup environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with production values
```

#### 3. Process Management (systemd)
Create `/etc/systemd/system/konsultabot.service`:
```ini
[Unit]
Description=KonsultaBot API Server
After=network.target

[Service]
Type=simple
User=konsultabot
WorkingDirectory=/opt/konsultabot
Environment=PATH=/opt/konsultabot/venv/bin
ExecStart=/opt/konsultabot/venv/bin/python backend/api/enhanced_chat_api.py
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 4. Reverse Proxy (Nginx)
Create `/etc/nginx/sites-available/konsultabot`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. Start Services
```bash
sudo systemctl enable konsultabot
sudo systemctl start konsultabot
sudo systemctl enable nginx
sudo systemctl start nginx
```

### **Mobile App Deployment**

#### 1. Build for Production
```bash
# Build APK for Android
npx expo build:android

# Build for iOS (requires Mac)
npx expo build:ios
```

#### 2. App Store Deployment
- Follow Expo's publishing guide
- Update app.json with production configuration
- Submit to Google Play Store / Apple App Store

---

## 🎯 **Capstone Project Deliverables**

### **✅ Technical Documentation**
- [x] **System Architecture Diagram**
- [x] **API Documentation**
- [x] **Database Schema**
- [x] **Deployment Guide**
- [x] **User Manual**

### **✅ Source Code**
- [x] **Backend Python Code** (Flask API, AI Integration)
- [x] **Mobile App Code** (React Native)
- [x] **Database Scripts** (SQLite setup)
- [x] **Configuration Files** (Environment, deployment)

### **✅ Testing & Validation**
- [x] **Unit Tests** (Core functionality)
- [x] **Integration Tests** (API endpoints)
- [x] **User Acceptance Testing** (Mobile app)
- [x] **Performance Testing** (Load and response times)

### **✅ Research Components**
- [x] **Literature Review** (AI in IT support)
- [x] **Methodology** (Hybrid online/offline approach)
- [x] **Results Analysis** (Performance metrics)
- [x] **Evaluation Framework** (Success criteria)

---

## 🏆 **Project Achievements**

### **Technical Excellence**
- ✅ **Robust AI Integration**: Handles Gemini API failures gracefully
- ✅ **Modern Mobile App**: Professional UI with excellent UX
- ✅ **Scalable Architecture**: Service-based, maintainable design
- ✅ **Comprehensive Analytics**: Real-time performance monitoring

### **Innovation & Impact**
- ✅ **Hybrid Intelligence**: Combines AI with local knowledge
- ✅ **Campus-Specific Solutions**: Tailored for EVSU Dulag
- ✅ **Accessibility Features**: Voice support, multi-language
- ✅ **Offline Capability**: Works without internet connection

### **Academic Standards**
- ✅ **Research-Based**: Grounded in IT support literature
- ✅ **Methodology**: Clear problem-solving approach
- ✅ **Evaluation**: Quantitative performance metrics
- ✅ **Documentation**: Comprehensive technical documentation

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Gemini API Not Working**
- ✅ **Solution**: System automatically falls back to local intelligence
- **Check**: API key in `.env` file
- **Verify**: Network connectivity
- **Test**: `python test_gemini.py`

#### **Mobile App Connection Issues**
- **Check**: Backend server running on correct IP/port
- **Update**: `apiConfig.js` with correct server address
- **Verify**: Firewall allows connections on port 8000

#### **Database Errors**
- **Solution**: Reinitialize database
```bash
rm konsultabot.db
python database.py
```

#### **Voice Recognition Not Working**
- **Check**: Microphone permissions granted
- **Verify**: Device supports speech recognition
- **Test**: Use text input as alternative

### **Performance Optimization**

#### **Backend Performance**
- Enable response caching for common queries
- Use connection pooling for database
- Implement request queuing for high load

#### **Mobile App Performance**
- Enable image optimization
- Implement lazy loading for chat history
- Use React Native performance monitoring

---

## 📞 **Support & Contact**

### **Technical Support**
- **Email**: [your-email@evsu.edu.ph]
- **GitHub**: [repository-link]
- **Documentation**: This deployment guide

### **Academic Contact**
- **Student**: [Your Name]
- **Program**: IT Technical Program
- **Institution**: EVSU Dulag Campus
- **Advisor**: [Advisor Name]

---

## 📄 **License & Credits**

### **Open Source Libraries**
- **Flask**: Web framework
- **React Native**: Mobile framework
- **Google Generative AI**: AI integration
- **Expo**: Development platform
- **SQLite**: Database engine

### **Project License**
This project is developed for academic purposes at EVSU Dulag Campus.

---

**🎓 KonsultaBot - Empowering IT Support Through AI Innovation**

*Developed as a capstone project for EVSU Dulag Campus*
*Bridging the gap between AI technology and practical IT support*
