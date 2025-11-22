import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosRetry from 'axios-retry';
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

// Helper to extract IP from Expo Metro bundler URL
const getMetroBundlerIP = () => {
  try {
    // Try to get IP from Expo Constants
    if (Constants.expoConfig?.hostUri) {
      // Format: "192.168.1.17:8081" or "192.168.1.17"
      const hostUri = Constants.expoConfig.hostUri;
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log('📱 Found Metro bundler IP:', ip);
        return ip;
      }
    }
    
    // Try manifest2
    if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
      const debuggerHost = Constants.manifest2.extra.expoGo.debuggerHost;
      const ip = debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log('📱 Found Metro bundler IP from manifest2:', ip);
        return ip;
      }
    }
    
    // Try legacy manifest
    if (Constants.manifest?.hostUri) {
      const hostUri = Constants.manifest.hostUri;
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        console.log('📱 Found Metro bundler IP from manifest:', ip);
        return ip;
      }
    }
  } catch (error) {
    console.log('⚠️ Could not extract Metro bundler IP:', error);
  }
  return null;
};

// Helper to detect if running on emulator
const isEmulator = () => {
  if (Platform.OS === 'web') return false;
  // Check if running on Android emulator
  if (Platform.OS === 'android') {
    // Emulator typically has specific device names or model
    // We'll use a heuristic: if we can't reach network IPs, we might be on emulator
    return false; // Let discovery determine this
  }
  return false;
};

// Dynamic Backend URL Discovery
// Priority order: Metro bundler IP first, then network IPs, then emulator IP
const getPossibleBackendURLs = () => {
  const urls = [];
  
  // Get Metro bundler IP (most reliable for physical devices)
  const metroIP = getMetroBundlerIP();
  if (metroIP) {
    urls.push(`http://${metroIP}:8000/api`);
    console.log('🎯 Using Metro bundler IP for backend discovery');
  }
  
  // For physical devices, prioritize network IPs
  // For emulator, prioritize 10.0.2.2
  if (Platform.OS === 'android') {
    // Try network IPs (physical device) - prioritize current IP first
    urls.push(
      'http://192.168.103.243:8000/api',  // Current network IP (PRIORITY)
      'http://10.143.17.242:8000/api',  // Previous WiFi IP
      'http://10.143.17.1:8000/api',      // Router IP variation
      'http://10.143.17.100:8000/api',    // Common range
      'http://192.168.1.17:8000/api',  // Common home network
      'http://192.168.0.17:8000/api',  // Alternative home network
      'http://192.168.100.17:8000/api', // Campus WiFi
      'http://10.0.0.17:8000/api',     // Alternative
      'http://172.20.10.2:8000/api',   // Mobile hotspot
      'http://10.0.2.2:8000/api'       // Android emulator (last resort)
    );
  } else if (Platform.OS === 'ios') {
    // iOS - try network IPs - prioritize current IP first
    urls.push(
      'http://192.168.103.243:8000/api',  // Current network IP (PRIORITY)
      'http://10.143.17.242:8000/api',
      'http://192.168.1.17:8000/api',
      'http://192.168.0.17:8000/api'
    );
  } else {
    // Web - current IP
    urls.push('http://192.168.103.243:8000/api');
  }
  
  // Remove duplicates
  return [...new Set(urls)];
};

// Cache for discovered backend URL
let cachedBackendURL = null;

// Function to discover working backend URL
const discoverBackendURL = async () => {
  // Check cache first
  try {
    const stored = await AsyncStorage.getItem('backend_url');
    if (stored) {
      // Verify cached URL still works
      try {
        const testResponse = await axios.get(`${stored.replace('/api', '')}/api/health/`, {
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        });
        if (testResponse.status === 200) {
          console.log('📦 Using cached backend URL:', stored);
          cachedBackendURL = stored;
          return stored;
        }
      } catch (e) {
        console.log('⚠️ Cached URL no longer works, discovering new one...');
        // Clear invalid cache
        await AsyncStorage.removeItem('backend_url');
      }
    }
  } catch (error) {
    console.log('Cache read error:', error);
  }

  console.log('🔍 Discovering backend URL...');
  
  // Get platform-specific URLs
  const POSSIBLE_BACKEND_URLS = getPossibleBackendURLs();
  
  // Check for manually set backend URL
  try {
    const manualURL = await AsyncStorage.getItem('manual_backend_url');
    if (manualURL) {
      try {
        const testResponse = await axios.get(`${manualURL.replace('/api', '')}/api/health/`, {
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        });
        if (testResponse.status === 200) {
          console.log('✅ Using manually set backend URL:', manualURL);
          cachedBackendURL = manualURL;
          await AsyncStorage.setItem('backend_url', manualURL);
          return manualURL;
        }
      } catch (e) {
        console.log('⚠️ Manually set URL not working, trying discovery...');
      }
    }
  } catch (error) {
    // Ignore
  }

  // Try each possible URL with better error handling
  let triedCount = 0;
  for (const url of POSSIBLE_BACKEND_URLS) {
    triedCount++;
    try {
      // Only log first few attempts to reduce noise
      if (triedCount <= 3) {
        console.log('🔍 Trying:', url);
      }
      const healthUrl = url.replace('/api', '') + '/api/health/';
      const response = await axios.get(healthUrl, {
        timeout: 5000, // Increased timeout for better reliability
        validateStatus: (status) => status === 200,
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ Found working backend:', url);
        cachedBackendURL = url;
        // Cache it
        try {
          await AsyncStorage.setItem('backend_url', url);
          console.log('💾 Cached backend URL for future use');
        } catch (e) {
          console.warn('⚠️ Cache write error:', e);
        }
        return url;
      }
    } catch (error) {
      // Continue to next URL - don't log every failure to reduce noise
      if (triedCount <= 3 && error.code !== 'ECONNABORTED') {
        // Only log first few failures
        continue;
      }
      continue;
    }
  }
  
  // Fallback based on platform
  let fallbackURL;
  if (Platform.OS === 'web') {
    fallbackURL = 'http://192.168.103.243:8000/api';
  } else if (Platform.OS === 'android') {
    // For Android, try emulator IP as last resort
    fallbackURL = 'http://192.168.103.243:8000/api';
  } else {
    // iOS or other
    fallbackURL = 'http://192.168.103.243:8000/api';
  }
  
  console.log('⚠️ No backend found after trying', POSSIBLE_BACKEND_URLS.length, 'URLs');
  console.log('💡 Using fallback:', fallbackURL);
  console.log('💡 Troubleshooting:');
  console.log('   1. Make sure backend is running: python manage.py runserver 0.0.0.0:8000');
  console.log('   2. Check your computer IP matches one in the discovery list');
  console.log('   3. Ensure phone and computer are on same WiFi network');
  console.log('   4. Try accessing http://YOUR_IP:8000/api/health/ from phone browser');
  console.log('   5. Check Windows Firewall allows port 8000');
  
  // Store fallback for potential retry
  cachedBackendURL = fallbackURL;
  return fallbackURL;
};

// Get initial baseURL - will be updated by discovery
// For mobile, we'll discover the correct URL, so start with a placeholder
let initialBaseURL = Platform.OS === 'web' 
  ? 'http://192.168.103.243:8000/api' 
  : 'http://192.168.103.243:8000/api'; // Temporary - will be discovered

// Create Axios instance with longer timeout and retries
const api = axios.create({
  baseURL: initialBaseURL,
  timeout: 45000, // 45 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': Platform.OS
  },
  validateStatus: status => status >= 200 && status < 500 // Don't reject if status is < 500
});

// Initialize backend URL discovery for mobile
if (Platform.OS !== 'web') {
  discoverBackendURL().then(url => {
    api.defaults.baseURL = url;
    console.log('🌐 Backend URL set to:', url);
  });
}

// Add enhanced retry mechanism
axiosRetry(api, { 
  retries: 3,
  retryDelay: (retryCount) => {
    return axiosRetry.exponentialDelay(retryCount) + Math.random() * 1000; // Add jitter
  },
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500) ||
      error.code === 'ERR_NETWORK'
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retry attempt ${retryCount} for ${requestConfig.url}:`, error.message);
  }
});

// Gemini API call function - FIXED VERSION
const callGeminiAPI = async (message) => {
  if (!validateGeminiConfig()) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }

    console.log('🤖 Calling Gemini API...');
    
    // Try official Google AI SDK first (web only)
    if (Platform.OS === 'web' && GoogleGenerativeAI) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const prompt = `${GEMINI_CONFIG.SYSTEM_PROMPT}\n\nUser: ${message}\n\nProvide a comprehensive, accurate answer.`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        const result = await model.generateContent(prompt, { signal: controller.signal });
        clearTimeout(timeout);
        
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini SDK success!');
        return {
          text: text,
          data: {
            response: text,
            mode: 'gemini-sdk',
            language: 'english'
          }
        };
      } catch (sdkError) {
        console.log('SDK failed, trying REST API:', sdkError.message);
      }
    }

    // Fallback to REST API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_CONFIG.API_KEY}`,
        {
          contents: [{
            parts: [{ text: `${GEMINI_CONFIG.SYSTEM_PROMPT}\n\nUser: ${message}` }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log('✅ Gemini REST API success!');
        const responseText = response.data.candidates[0].content.parts[0].text;
        return {
          text: responseText,
          data: {
            response: responseText,
            mode: 'gemini-rest',
            language: 'english'
          }
        };
      }

      throw new Error('Empty response from Gemini API');
    } catch (error) {
      clearTimeout(timeout);
      console.error('❌ Gemini API error:', error.response?.status, error.message);
      
      // Try local fallback
      try {
        return await localGeminiAI.generateResponse(message);
      } catch (fallbackError) {
        throw new Error('Unable to generate response. Please try again later.');
      }
    }
  } catch (mainError) {
    console.error('❌ Main API error:', mainError.message);
    throw mainError;
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
    // Web (browser) - Use localhost
    if (Platform.OS === 'web') {
      return 'http://192.168.103.243:8000/api';
    }

    // Mobile - Use network discovery
    try {
      const savedIP = await AsyncStorage.getItem(SERVER_IP_KEY);
      if (savedIP) {
        console.log(`Using saved server IP: ${savedIP}`);
        return `http://${savedIP}:8000/api`;
      }
    } catch (storageError) {
      console.warn('Failed to read saved server IP:', storageError);
    }

    // Try to discover server automatically using the standalone function
    console.log('Attempting server discovery...');
    // Use the standalone discoverBackendURL function instead
    const discoveredURL = await discoverBackendURL();
    
    if (discoveredURL) {
      console.log(`✅ Server discovered at ${discoveredURL}`);
      return discoveredURL;
    }

    // Fallback to default IP
    const defaultIP = '192.168.103.243';
    console.warn(`Using default server IP: ${defaultIP}`);
    return `http://${defaultIP}:8000/api`;
  } catch (error) {
    console.error('Error in getApiUrl:', error);
    // Fallback based on platform
    const fallbackIP = '192.168.103.243';
    return `http://${fallbackIP}:8000/api`;
  }
};

// Initialize with a default URL, will be updated
let API_BASE_URL = 'http://192.168.103.243:8000/api';

class ApiService {
  constructor() {
    this.offlineMode = false;
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 60 seconds for AI processing
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
      // Try /api/health/ endpoint (full path)
      const healthUrl = this.api.defaults.baseURL.replace('/api', '') + '/api/health/';
      const response = await axios.get(healthUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 200-499 as valid responses
      });
      console.log('✅ Backend health check successful:', healthUrl, response.status);
      return response.status === 200;
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
      // Also try the /health endpoint without /api prefix
      try {
        const altHealthUrl = this.api.defaults.baseURL.replace('/api', '') + '/health/';
        const altResponse = await axios.get(altHealthUrl, { timeout: 5000 });
        console.log('✅ Backend health check successful (alt endpoint):', altHealthUrl);
        return altResponse.status === 200;
      } catch (altError) {
        console.log('❌ Backend health check failed (alt endpoint):', altError.message);
        return false;
      }
    }
  }

  // Auth endpoints
  async login(email, password) {
    try {
      // Ensure backend URL is discovered
      await this.ensureBackendURL();
      
      // Clean and prepare login data
      const username = email.trim().toLowerCase();
      const loginData = {
        username: username,
        password: password
      };
      
      console.log('🔐 Attempting login...', { 
        username: username, 
        backendURL: this.api.defaults.baseURL,
        passwordLength: password ? password.length : 0
      });
      
      const response = await this.api.post('/auth/login/', loginData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });
      
      console.log('✅ Login response received:', {
        status: response.status,
        hasToken: !!(response.data?.access || response.data?.access_token),
        hasUser: !!response.data?.user
      });
      
      // Handle different response formats
      if (response.data.access || response.data.access_token || response.data.user) {
        return response;
      }
      
      // If response doesn't have token, it might be an error
      if (response.status !== 200 && response.status !== 201) {
        const errorMsg = response.data?.error || response.data?.message || response.data?.detail || 'Login failed';
        throw new Error(errorMsg);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login API error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      });
      
      // Provide user-friendly error messages
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on port 8000.');
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Connection timeout. Please check your network connection.');
      }
      
      if (error.response?.status === 401) {
        const errorMsg = error.response.data?.error || error.response.data?.message || 
                        error.response.data?.detail || 'Invalid username or password. Please try again.';
        throw new Error(errorMsg);
      }
      
      if (error.response?.status === 400) {
        // Extract detailed error from Django serializer
        const errorData = error.response.data;
        let errorMessage = 'Invalid request. Please check your credentials.';
        
        if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors;
        } else if (errorData.username) {
          errorMessage = Array.isArray(errorData.username) 
            ? errorData.username[0] 
            : errorData.username;
        } else if (errorData.password) {
          errorMessage = Array.isArray(errorData.password) 
            ? errorData.password[0] 
            : errorData.password;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        throw new Error(errorMessage);
      }
      
      // Generic error
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.response?.data?.detail ||
                      error.message || 
                      'An error occurred during login. Please try again.';
      throw new Error(errorMsg);
    }
  }

  async register(userData) {
    try {
      // Ensure backend URL is discovered
      await this.ensureBackendURL();
      
      // Check network connectivity first
      const isConnected = await checkNetworkStatus();
      if (!isConnected) {
        throw new Error('No network connection available');
      }

      // Validate required fields
      const requiredFields = ['username', 'email', 'password', 'password_confirm'];
      for (const field of requiredFields) {
        if (!userData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      console.log('Sending registration data:', {
        ...userData,
        password: '***',
        password_confirm: '***'
      });

      // Make the API call with retry logic
      let retries = 2;
      while (retries >= 0) {
        try {
          const response = await this.api.post('/auth/register/', userData);
          console.log('Registration successful:', response.status);
          return response;
        } catch (error) {
          if (retries === 0 || error.response?.status === 400) {
            // Log detailed error for 400 responses
            if (error.response?.status === 400) {
              console.error('Registration validation error:', error.response?.data);
            }
            throw error; // Don't retry client errors or if out of retries
          }
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running.');
      }
      
      throw {
        message: error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed',
        status: error.response?.status || 500,
        details: error.response?.data || {}
      };
    }
  }

  async logout() {
    return this.api.post('/auth/logout/');
  }

  async getProfile() {
    return this.api.get('/auth/profile/');
  }

  async updateProfile(profileData) {
    return this.api.put('/auth/profile/', profileData);
  }

  // NEW: Hybrid chat endpoint (Gemini + Knowledge Base)
  // Using simple-gemini endpoint (no auth required for demo)
  async sendChatMessage(query) {
    try {
      console.log('📡 Calling backend chat endpoint: /chat/simple-gemini/');
      const payload = { message: query };
      console.log('📤 Sending payload:', payload);
      
      const response = await this.api.post('/chat/simple-gemini/', payload, {
        timeout: 60000 // 60 seconds for AI processing
      });
      console.log('✅ Backend response:', response.data);
      
      // Return in consistent format
      return {
        message: response.data.response || response.data.message || response.data.text,
        source: response.data.source || 'gemini',
        confidence: response.data.confidence || response.data.ai_confidence || 0.95
      };
    } catch (error) {
      console.error('❌ Backend chat error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data?.detail || error.response?.data,
        message: error.message
      });
      throw error;
    }
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

  // Ensure backend URL is discovered and set
  async ensureBackendURL() {
    try {
      // Check if we already have a working URL
      if (this.api.defaults.baseURL) {
        try {
          const healthCheck = await axios.get(`${this.api.defaults.baseURL.replace('/api', '')}/api/health/`, {
            timeout: 5000,
            headers: { 'Accept': 'application/json' }
          });
          if (healthCheck.status === 200) {
            console.log('✅ Current backend URL is working:', this.api.defaults.baseURL);
            return;
          }
        } catch (e) {
          console.log('⚠️ Current backend URL not working, discovering new one...');
        }
      }
      
      // Discover and set new URL
      console.log('🔍 Discovering backend URL...');
      const newUrl = await discoverBackendURL();
      if (newUrl && newUrl !== this.api.defaults.baseURL) {
        this.api.defaults.baseURL = newUrl;
        API_BASE_URL = newUrl;
        console.log('✅ Backend URL set to:', newUrl);
        
        // Cache the working URL
        try {
          await AsyncStorage.setItem('backend_url', newUrl);
        } catch (e) {
          console.warn('Failed to cache backend URL:', e);
        }
      } else if (newUrl) {
        console.log('✅ Using existing backend URL:', newUrl);
      }
    } catch (error) {
      console.error('❌ Error ensuring backend URL:', error);
      // Don't throw - use fallback URL
    const fallbackURL = 'http://192.168.103.243:8000/api';
      this.api.defaults.baseURL = fallbackURL;
      console.log('⚠️ Using fallback URL:', fallbackURL);
    }
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
    // Only initialize on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      try {
        window.addEventListener('online', () => this.checkAndUpdateConnection());
        window.addEventListener('offline', () => console.warn('Network connection lost'));
      } catch (error) {
        console.warn('Failed to initialize web network listeners:', error);
      }
    } else if (Platform.OS !== 'web') {
      // React Native network listener
      try {
        NetInfo.addEventListener(state => {
          if (state.isConnected) {
            this.checkAndUpdateConnection();
          } else {
            console.warn('Network connection lost');
          }
        });
      } catch (error) {
        console.warn('Failed to initialize React Native network listeners:', error);
      }
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

// Create and export the API service instance
const apiServiceInstance = new ApiService();

// Export configured API service with all methods
export const apiService = apiServiceInstance;

// Also export utility functions
export {
  api,
  callGeminiAPI,
  checkNetworkStatus,
  getApiUrl
};
