import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEMINI_CONFIG, validateGeminiConfig } from '../config/gemini';
import { localGeminiAI } from './localGeminiAI';

// Import Google AI SDK for web
let GoogleGenerativeAI = null;
if (Platform.OS === 'web') {
  try {
    const { GoogleGenerativeAI: GGAI } = require('@google/generative-ai');
    GoogleGenerativeAI = GGAI;
  } catch (error) {
    console.log('Google AI SDK not available');
  }
}

// Gemini API call function using official Google AI SDK
const callGeminiAPI = async (message) => {
  // Check if API key is configured
  if (!validateGeminiConfig()) {
    throw new Error('Gemini API key not configured');
  }

  try {
    console.log('🤖 Calling Gemini API with official SDK...');
    
    // Try official Google AI SDK first (web only)
    if (Platform.OS === 'web' && GoogleGenerativeAI) {
      const modelsToTry = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.0-pro'];
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`Trying Gemini model: ${modelName}`);
          const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.API_KEY);
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `${GEMINI_CONFIG.SYSTEM_PROMPT}

User question: ${message}

Please provide a helpful, detailed response as an IT support expert.`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          console.log(`✅ Gemini SDK response received from ${modelName}`);
          return {
            data: {
              response: text,
              mode: 'gemini-sdk',
              language: 'english'
            }
          };
        } catch (sdkError) {
          console.log(`${modelName} failed:`, sdkError.message);
        }
      }
      console.log('All SDK models failed, trying REST API');
    }

    // Fallback to REST API with multiple endpoints
    const prompt = `${GEMINI_CONFIG.SYSTEM_PROMPT}

User question: ${message}

Please provide a helpful, detailed response as an IT support expert.`;

    // Try REST API endpoints
    for (let i = 0; i < GEMINI_CONFIG.API_URLS.length; i++) {
      const endpoint = GEMINI_CONFIG.API_URLS[i];
      console.log(`Trying endpoint ${i + 1}/${GEMINI_CONFIG.API_URLS.length}: ${endpoint}`);
      
      try {
        const requestBody = {
          contents: [{
            parts: [{ text: `${GEMINI_CONFIG.SYSTEM_PROMPT}\n\nUser: ${message}` }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        };

        const response = await axios.post(`${endpoint}?key=${GEMINI_CONFIG.API_KEY}`, requestBody, {
          timeout: GEMINI_CONFIG.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'KonsultaBot/1.0'
          }
        });

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log('✅ Gemini REST API success!');
          return {
            data: {
              response: response.data.candidates[0].content.parts[0].text,
              mode: 'gemini-rest',
              language: 'english'
            }
          };
        } else {
          console.warn('⚠️ Gemini API returned empty response');
        }
      } catch (error) {
        console.warn(`❌ Gemini endpoint ${i + 1} failed:`, {
          status: error.response?.status,
          message: error.message
        });
        
        // If this is a 404 or authentication error, skip to fallback
        if (error.response?.status === 404 || error.response?.status === 403) {
          console.log('🔄 Skipping to local AI due to API access issues');
          break;
        }
      }
    }

    throw new Error('All Gemini API endpoints failed - using local AI fallback');

  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
    throw error;
  }
};

// Cache for server IP to avoid re-discovery
const SERVER_IP_KEY = '@konsulta_server_ip';

// Check network connectivity
const checkNetworkStatus = async () => {
  try {
    if (Platform.OS === 'web') {
      // For web, we'll assume network is available if we can access the window object
      return navigator.onLine !== false;
    } else {
      // For React Native
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable !== false;
    }
  } catch (error) {
    console.warn('Network status check failed:', error);
    return false;
  }
};

// Get the best available server URL
const getApiUrl = async () => {
  try {
    // Web (browser) - Use offline mode for demo
    if (Platform.OS === 'web') {
      const hasWindow = typeof window !== 'undefined';
      const hostname = hasWindow && window.location && window.location.hostname ? 
        window.location.hostname : 'localhost';
      
      // For demo purposes, we'll use offline mode since no backend is running
      console.log('Web platform detected - using offline mode');
      return null; // This will trigger offline mode
    }

    // Mobile - Check for saved IP first
    try {
      const savedIP = await AsyncStorage.getItem(SERVER_IP_KEY);
      if (savedIP) {
        console.log(`Using saved server IP: ${savedIP}`);
        return `http://${savedIP}:8000/api`;
      }
    } catch (storageError) {
      console.warn('Failed to read saved server IP:', storageError);
    }

    // Skip server discovery to avoid errors
    console.log('Skipping server discovery - using fallback');

    // Fallback to appropriate IP based on platform
    const defaultIP = Platform.OS === 'web' ? 'localhost' : '192.168.1.17';
    console.warn(`Using default server IP for ${Platform.OS}: ${defaultIP}`);
    return `http://${defaultIP}:8000/api/chat`;
  } catch (error) {
    console.error('Error in getApiUrl:', error);
    return 'http://192.168.1.5:8000/api/chat';
  }
};

// Initialize with a default URL, will be updated
let API_BASE_URL = 'http://192.168.1.5:8000/api/chat';

class ApiService {
  constructor() {
    this.offlineMode = false;
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 8000, // Increased timeout for mobile networks
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize network listeners
    this.initializeNetworkListeners();
    // Initial connection check
    this.checkAndUpdateConnection();

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log('Making API request to:', config.baseURL + config.url);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('API response received:', response.status);
        return response;
      },
      (error) => {
        console.log('API error:', {
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        if (error.response?.status === 401) {
          // Handle unauthorized access
          this.authToken = null;
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getBaseUrl() {
    return API_BASE_URL;
  }

  async checkHealth() {
    try {
      const response = await this.api.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.api.post('/users/login/', { email, password });
  }

  async register(userData) {
    return this.api.post('/users/register/', userData);
  }

  async logout() {
    return this.api.post('/users/logout/');
  }

  async getProfile() {
    return this.api.get('/users/profile/');
  }

  async updateProfile(profileData) {
    return this.api.put('/users/profile/update/', profileData);
  }

  // Chat endpoints with offline support
  async sendMessage(message, language = 'english', sessionId = null) {
    // Check if we're on web platform - try real Gemini API first
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform detected - attempting real Gemini API first');
      
      // First attempt: Try real Gemini API
      try {
        console.log('🤖 Attempting real Gemini API...');
        const geminiResponse = await callGeminiAPI(message);
        console.log('✅ Real Gemini API success!');
        return geminiResponse;
      } catch (geminiError) {
        console.log('❌ Real Gemini API failed:', geminiError.message);
        console.log('🔄 Falling back to Local Gemini AI...');
        
        // Second attempt: Use local Gemini-like AI system
        try {
          const response = await localGeminiAI.generateResponse(message, language);
          console.log('✅ Local Gemini AI response generated');
          return response;
        } catch (localError) {
          console.log('❌ Local AI failed, using basic fallback responses');
          return this.getOfflineResponse(message, language);
        }
      }
    }

    const payload = {
      message,
      language,
    };
    
    // Only include session_id if it's not null
    if (sessionId) {
      payload.session_id = sessionId;
    }
    
    try {
      return await this.api.post('/chat/send/', payload);
    } catch (error) {
      // If network fails, provide offline response
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Network Error')) {
        console.log('🔌 Network unavailable, providing offline response');
        return this.getOfflineResponse(message, language);
      }
      throw error;
    }
  }

  // Offline response generator
  getOfflineResponse(message, language) {
    // Check if we're on web platform (demo mode)
    const isWebDemo = Platform.OS === 'web';
    
    const offlineResponses = {
      english: {
        greeting: isWebDemo 
          ? "Hello! I'm KonsultaBot, your intelligent IT support assistant. I can help you with computer problems, software issues, network troubleshooting, and answer any tech questions you have!"
          : "Hello! I'm KonsultaBot. I'm currently offline, but I can still help with basic campus information.",
        courses: "EVSU Dulag offers undergraduate programs in Education, Business Administration, and Computer Science. Each program has specific requirements and duration.",
        library: "The EVSU Dulag library is located on the main campus building. It provides study areas, books, and computer access for students.",
        facilities: "EVSU Dulag has various facilities including classrooms, library, computer lab, gymnasium, and cafeteria.",
        enrollment: "For enrollment information, please visit the Registrar's office when you're back online or contact them directly.",
        fallback: isWebDemo
          ? "I'm your IT support assistant! I can help with computer problems, software issues, network troubleshooting, and general tech support. What IT issue can I help you with today?"
          : "I'm currently offline. Here's some basic EVSU Dulag information: We offer programs in Education, Business, and Computer Science. The campus has a library, computer lab, and gymnasium. For more details, please try again when you're online."
      },
      bisaya: {
        greeting: "Kumusta! Ako si KonsultaBot. Offline ko karon, pero makatabang gihapon ko sa basic campus information.",
        courses: "Ang EVSU Dulag nag-offer og undergraduate programs sa Education, Business Administration, ug Computer Science.",
        library: "Ang library sa EVSU Dulag naa sa main campus building. Naa'y study areas, books, ug computer access.",
        facilities: "Ang EVSU Dulag naa'y mga facilities sama sa classrooms, library, computer lab, gymnasium, ug cafeteria.",
        enrollment: "Para sa enrollment info, adto sa Registrar's office kung online na ka o kontak sila direkta.",
        fallback: "Offline ko karon. Ania ang basic info sa EVSU Dulag: Naa'y programs sa Education, Business, ug Computer Science. Ang campus naa'y library, computer lab, ug gymnasium."
      },
      waray: {
        greeting: "Maupay nga adlaw! Ako si KonsultaBot. Offline ako karon, pero makakabulig pa ako han basic campus information.",
        courses: "An EVSU Dulag nag-offer hin undergraduate programs ha Education, Business Administration, ngan Computer Science.",
        library: "An library han EVSU Dulag naa ha main campus building. Mayda study areas, books, ngan computer access.",
        facilities: "An EVSU Dulag mayda mga facilities pareho han classrooms, library, computer lab, gymnasium, ngan cafeteria.",
        enrollment: "Para han enrollment info, kadto ha Registrar's office kun online na ka o kontak hira direkta.",
        fallback: "Offline ako karon. Ire an basic info han EVSU Dulag: Mayda programs ha Education, Business, ngan Computer Science. An campus mayda library, computer lab, ngan gymnasium."
      },
      tagalog: {
        greeting: "Kumusta! Ako si KonsultaBot. Offline ako ngayon, pero makakatulong pa rin ako sa basic campus information.",
        courses: "Ang EVSU Dulag ay nag-offer ng undergraduate programs sa Education, Business Administration, at Computer Science.",
        library: "Ang library ng EVSU Dulag ay nasa main campus building. May study areas, books, at computer access.",
        facilities: "Ang EVSU Dulag ay may mga facilities tulad ng classrooms, library, computer lab, gymnasium, at cafeteria.",
        enrollment: "Para sa enrollment info, pumunta sa Registrar's office kapag online ka na o kontakin sila directly.",
        fallback: "Offline ako ngayon. Narito ang basic info ng EVSU Dulag: May mga programs sa Education, Business, at Computer Science. Ang campus ay may library, computer lab, at gymnasium."
      }
    };

    const responses = offlineResponses[language] || offlineResponses.english;
    const messageLower = message.toLowerCase();

    // Determine appropriate response based on message content
    if (messageLower.includes('hello') || messageLower.includes('hi') || 
        messageLower.includes('kumusta') || messageLower.includes('maupay')) {
      return { data: { response: responses.greeting, mode: 'offline', language } };
    }

    // IT Support responses for web demo
    if (isWebDemo) {
      // Computer/laptop issues
      if (messageLower.includes('computer') || messageLower.includes('laptop') || 
          messageLower.includes('pc') || messageLower.includes('desktop')) {
        return { data: { 
          response: "🖥️ **Computer Troubleshooting Help**\n\nI can help with your computer issue! Here are some common solutions:\n\n**Quick Fixes:**\n• Restart your computer\n• Check all cable connections\n• Ensure power is connected properly\n• Try safe mode if it won't start\n\n**Common Issues:**\n• Slow performance → Check for malware, free up disk space\n• Won't turn on → Check power supply and connections\n• Blue screen → Note error codes and restart\n• Overheating → Clean dust from vents and fans\n\nWhat specific computer problem are you experiencing?", 
          mode: 'demo', language 
        }};
      }

      // Internet/WiFi issues
      if (messageLower.includes('internet') || messageLower.includes('wifi') || 
          messageLower.includes('network') || messageLower.includes('connection')) {
        return { data: { 
          response: "🌐 **Internet & WiFi Troubleshooting**\n\n**Quick WiFi Fixes:**\n• Restart your router (unplug for 30 seconds)\n• Forget and reconnect to WiFi network\n• Check if other devices can connect\n• Move closer to the router\n\n**Network Troubleshooting:**\n• Run network diagnostics\n• Update network drivers\n• Check for ISP outages\n• Reset network settings\n\n**Speed Issues:**\n• Test speed at speedtest.net\n• Close bandwidth-heavy apps\n• Check for background updates\n\nIs your internet completely down or just slow?", 
          mode: 'demo', language 
        }};
      }

      // Software issues
      if (messageLower.includes('software') || messageLower.includes('program') || 
          messageLower.includes('app') || messageLower.includes('install')) {
        return { data: { 
          response: "💻 **Software & Application Help**\n\n**Installation Issues:**\n• Run as administrator\n• Check system requirements\n• Disable antivirus temporarily\n• Clear temp files\n\n**Program Won't Start:**\n• Restart computer\n• Update the software\n• Check for Windows updates\n• Reinstall the program\n\n**Common Software Problems:**\n• Crashes → Check event logs, update drivers\n• Slow performance → Close other programs\n• Error messages → Note exact error text\n\nWhat software issue are you having?", 
          mode: 'demo', language 
        }};
      }

      // Email issues
      if (messageLower.includes('email') || messageLower.includes('outlook') || 
          messageLower.includes('gmail') || messageLower.includes('mail')) {
        return { data: { 
          response: "📧 **Email Setup & Troubleshooting**\n\n**Email Setup:**\n• Get settings from your email provider\n• Use IMAP for multiple devices\n• Enable 2-factor authentication\n\n**Common Email Issues:**\n• Can't send emails → Check SMTP settings\n• Not receiving emails → Check spam folder\n• Password errors → Reset email password\n• Sync issues → Remove and re-add account\n\n**Outlook Specific:**\n• Repair Office installation\n• Create new Outlook profile\n• Check for updates\n\nWhat email problem can I help you solve?", 
          mode: 'demo', language 
        }};
      }

      // Mobile Legends (gaming question)
      if (messageLower.includes('mobile legends') || messageLower.includes('ml') || 
          messageLower.includes('game') || messageLower.includes('gaming')) {
        return { data: { 
          response: "🎮 **Gaming & Mobile Legends**\n\nMobile Legends is a popular MOBA (Multiplayer Online Battle Arena) game for mobile devices.\n\n**Game Info:**\n• 5v5 team battles\n• Choose from 100+ heroes\n• Rank up through competitive play\n• Free-to-play with in-app purchases\n\n**Technical Issues:**\n• Lag → Check internet connection, close other apps\n• Won't load → Clear game cache, restart device\n• Account issues → Contact Moonton support\n• Updates → Enable auto-updates in app store\n\n**Performance Tips:**\n• Close background apps\n• Use gaming mode if available\n• Ensure stable internet connection\n\nAre you having technical issues with the game?", 
          mode: 'demo', language 
        }};
      }
    }
    
    // Campus-related responses (for mobile/offline mode)
    if (messageLower.includes('course') || messageLower.includes('program') || 
        messageLower.includes('kurso')) {
      return { data: { response: responses.courses, mode: 'offline', language } };
    }
    
    if (messageLower.includes('library') || messageLower.includes('libro')) {
      return { data: { response: responses.library, mode: 'offline', language } };
    }
    
    if (messageLower.includes('facility') || messageLower.includes('facilities')) {
      return { data: { response: responses.facilities, mode: 'offline', language } };
    }
    
    if (messageLower.includes('enroll') || messageLower.includes('enrollment')) {
      return { data: { response: responses.enrollment, mode: 'offline', language } };
    }

    return { data: { response: responses.fallback, mode: isWebDemo ? 'demo' : 'offline', language } };
  }

  async getConversationHistory() {
    return this.api.get('/chat/history/');
  }

  async getChatSessions() {
    return this.api.get('/chat/sessions/');
  }

  async endChatSession(sessionId) {
    return this.api.post('/chat/sessions/end/', { session_id: sessionId });
  }

  async getKnowledgeBase(language = 'english', category = null) {
    const params = { language };
    if (category) params.category = category;
    return this.api.get('/chat/knowledge/', { params });
  }

  async getCampusInfo(language = 'english', category = null) {
    const params = { language };
    if (category) params.category = category;
    return this.api.get('/chat/campus-info/', { params });
  }

  async searchKnowledge(query, language = 'english') {
    return this.api.get('/chat/search/', {
      params: { q: query, language },
    });
  }

  // General endpoints
  async healthCheck() {
    return this.api.get('/health/');
  }

  async getApiStatus() {
    return this.api.get('/status/');
  }

  // Gemini testing endpoint
  async testGemini(message = 'What is artificial intelligence?') {
    return this.api.post('/chat/test-gemini/', { 
      message, 
      language: 'english' 
    });
  }

  // Direct Gemini chat test (no auth required)
  async testChatGemini(message = 'What is artificial intelligence?') {
    return this.api.post('/chat/test-chat-gemini/', { 
      message, 
      language: 'english' 
    });
  }

  // Working Gemini endpoint (no auth required)
  async askGemini(message = 'What is artificial intelligence?') {
    return this.api.post('/chat/simple-gemini/', { 
      message 
    });
  }

  // Check and update connection status
  async checkAndUpdateConnection() {
    try {
      const isConnected = await checkNetworkStatus();
      if (!isConnected) {
        console.warn('No network connection available');
        return false;
      }

      // Try to update the base URL
      const newUrl = await getApiUrl();
      if (newUrl !== this.api.defaults.baseURL) {
        console.log(`Updating API base URL to: ${newUrl}`);
        this.api.defaults.baseURL = newUrl;
        API_BASE_URL = newUrl; // Update the global constant
      }

      // Verify the connection
      const response = await axios.get(`${newUrl}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ Server is reachable');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Connection check failed:', error.message);
      return false;
    }
  }

  // Initialize network status listeners
  initializeNetworkListeners() {
    if (Platform.OS === 'web') {
      window.addEventListener('online', () => this.checkAndUpdateConnection());
      window.addEventListener('offline', () => console.warn('Network connection lost'));
    } else {
      // React Native network listener
      NetInfo.addEventListener(state => {
        if (state.isConnected) {
          this.checkAndUpdateConnection();
        } else {
          console.warn('Network connection lost');
        }
      });
    }
  }

  // Server discovery with better error handling and retries
  async discoverServer() {
    console.log('Starting server discovery...');
    const possibleIPs = [
      '192.168.1.5',  // Your current IP (moved to top)
      '192.168.1.1',  // Common router IP
      '192.168.0.1',  // Another common router IP
      '192.168.1.100', // Common server IP
      '192.168.1.10',
      '192.168.1.17',
      '192.168.1.11',
      '192.168.0.100',
      '10.0.0.100'
    ];

    // Try each IP with a timeout
    const checkPromises = possibleIPs.map(ip => 
      this.checkServer(ip).catch(() => null)
    );

    // Wait for the first successful connection or all to fail
    const results = await Promise.all(checkPromises);
    const activeServer = results.find(result => result !== null);
    
    if (activeServer) {
      console.log(`✅ Discovered server at ${activeServer.ip}`);
      return activeServer.ip;
    }
    
    console.warn('❌ No servers found during discovery');
    return null;
  }

  // Check if a specific server is reachable
  async checkServer(ip) {
    const testUrl = `http://${ip}:8000/api/health`;
    try {
      console.log(`Checking server at ${ip}...`);
      const response = await axios.get(testUrl, { 
        timeout: 3000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.status === 200) {
        return { ip };
      }
      throw new Error(`Unexpected status: ${response.status}`);
    } catch (error) {
      console.log(`❌ Server not reachable at ${ip}: ${error.message}`);
      throw error;
    }
  }

  // Auto-configure API service with retry logic
  async autoConfig(retries = 2, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`🔍 Auto-discovering server (attempt ${attempt}/${retries})...`);
      try {
        const discoveredIP = await this.discoverServer();
        if (discoveredIP) {
          console.log('✅ Server auto-configured successfully');
          return { success: true, serverIP: discoveredIP };
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error.message);
      }
      
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.warn('❌ Auto-config failed after all attempts, using default IP');
    return { 
      success: false, 
      error: 'Failed to discover server after multiple attempts' 
    };
  }
}

export const apiService = new ApiService();
