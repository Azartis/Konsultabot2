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
  
  // For physical devices, prioritize network IPs (fallback only - Ngrok is priority)
  // For emulator, prioritize 10.0.2.2
  if (Platform.OS === 'android') {
    // Try network IPs (physical device) - FALLBACK ONLY (Ngrok is checked first)
    // These are only used if Ngrok is not available
    urls.push(
      'http://10.0.2.2:8000/api',       // Android emulator (for testing)
      // Note: Local IPs removed - use Ngrok for production APK
    );
  } else if (Platform.OS === 'ios') {
    // iOS - minimal fallback (Ngrok is priority)
    urls.push(
      'http://localhost:8000/api',     // Local development only
    );
  } else {
    // Web - try current host first (Expo web often runs on same machine)
    const webHost =
      typeof window !== 'undefined' && window.location?.hostname
        ? window.location.hostname
        : 'localhost';

    urls.push(
      `http://${webHost}:8000/api`,      // Current host → backend port 8000
      'http://localhost:8000/api',       // Explicit localhost
      'http://127.0.0.1:8000/api',       // Loopback alternative
    );
  }
  
  // Remove duplicates
  return [...new Set(urls)];
};

// Cache for discovered backend URL
let cachedBackendURL = null;

// Function to discover working backend URL
const discoverBackendURL = async () => {
  // PRIORITY 1: Check for Ngrok URL from environment/config (highest priority for global access)
  try {
    // Check app.json extra.apiUrl first (most reliable)
    let ngrokUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    
    // Clean up the URL (remove trailing slash, remove /api if present)
    if (ngrokUrl && typeof ngrokUrl === 'string') {
      ngrokUrl = ngrokUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
    }
    
    if (ngrokUrl && typeof ngrokUrl === 'string' && (ngrokUrl.includes('ngrok.io') || ngrokUrl.includes('ngrok-free.dev') || ngrokUrl.includes('ngrok.app'))) {
      const ngrokApiUrl = `${ngrokUrl}/api`;
      try {
        // Test the health endpoint
        const testResponse = await axios.get(`${ngrokApiUrl}/health/`, {
          timeout: 10000,
          headers: { 
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
          }
        });
        if (testResponse.status === 200) {
          console.log('🌐 Using Ngrok URL for global access:', ngrokApiUrl);
          cachedBackendURL = ngrokApiUrl;
          await AsyncStorage.setItem('backend_url', ngrokApiUrl);
          return ngrokApiUrl;
        }
      } catch (e) {
        // Even if health check fails, use ngrok URL as it might be a temporary issue
        console.log('⚠️ Ngrok health check failed, but using ngrok URL anyway:', ngrokApiUrl);
        console.log('   Error:', e.message);
        cachedBackendURL = ngrokApiUrl;
        await AsyncStorage.setItem('backend_url', ngrokApiUrl);
        return ngrokApiUrl;
      }
    }
  } catch (error) {
    console.log('Ngrok URL check error:', error);
  }

  // PRIORITY 2: Check cache
  try {
    const stored = await AsyncStorage.getItem('backend_url');
    if (stored && typeof stored === 'string') {
      // Skip cache if it's a local IP and we're looking for global access
      const isLocalIP = stored.includes('192.168.') || stored.includes('10.0.') || stored.includes('127.0.0.1') || stored.includes('localhost');
      
            // If cached URL is Ngrok, always try it first
            if (stored.includes('ngrok.io') || stored.includes('ngrok-free.dev') || stored.includes('ngrok.app')) {
        try {
          const testResponse = await axios.get(`${stored.replace('/api', '')}/api/health/`, {
            timeout: 10000,
            headers: { 'Accept': 'application/json' }
          });
          if (testResponse.status === 200) {
            console.log('📦 Using cached Ngrok URL:', stored);
            cachedBackendURL = stored;
            return stored;
          }
        } catch (e) {
          console.log('⚠️ Cached Ngrok URL no longer works, discovering new one...');
          await AsyncStorage.removeItem('backend_url');
        }
      } else if (!isLocalIP) {
        // Try cached non-local URL
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
          await AsyncStorage.removeItem('backend_url');
        }
      }
    }
  } catch (error) {
    console.log('Cache read error:', error);
  }

  console.log('🔍 Discovering backend URL...');
  
  // PRIORITY 3: Get platform-specific URLs (local network fallback)
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
    fallbackURL = 'http://localhost:8000/api';  // Localhost for web
  } else if (Platform.OS === 'android') {
    // For Android APK, use Ngrok URL as fallback (should be set in app.config.js)
    fallbackURL = Constants.expoConfig?.extra?.apiUrl || 
                  Constants.expoConfig?.extra?.ngrokUrl ? `${Constants.expoConfig.extra.ngrokUrl}/api` :
                  'https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api';
  } else {
    // iOS - use Ngrok URL
    fallbackURL = Constants.expoConfig?.extra?.apiUrl || 
                  Constants.expoConfig?.extra?.ngrokUrl ? `${Constants.expoConfig.extra.ngrokUrl}/api` :
                  'https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api';
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
// Priority: Ngrok URL from config > localhost (web) > fallback
let initialBaseURL;
if (Platform.OS === 'web') {
  initialBaseURL = 'http://localhost:8000/api';  // Web uses localhost
} else {
  // Mobile: Use Ngrok URL from config (embedded in build)
  let ngrokUrl = Constants.expoConfig?.extra?.apiUrl || 
                 Constants.manifest?.extra?.apiUrl ||
                 Constants.expoConfig?.extra?.ngrokUrl ||
                 Constants.manifest?.extra?.ngrokUrl ||
                 process.env.EXPO_PUBLIC_NGROK_URL ||
                 process.env.EXPO_PUBLIC_BACKEND_URL;
  
  // Clean up the URL (remove trailing slash, remove /api if present)
  if (ngrokUrl && typeof ngrokUrl === 'string') {
    ngrokUrl = ngrokUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  
  if (ngrokUrl && (ngrokUrl.includes('ngrok') || ngrokUrl.includes('https://'))) {
    initialBaseURL = `${ngrokUrl}/api`;
  } else {
    // Fallback to default Ngrok URL
    initialBaseURL = 'https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api';
  }
}

// Create Axios instance with longer timeout and retries
const api = axios.create({
  baseURL: initialBaseURL,
  timeout: 45000, // 45 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': Platform.OS,
    'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning for all requests
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
      // For web, be more lenient - assume online if navigator exists
      // Free WiFi might report offline even when connected
      if (typeof navigator !== 'undefined') {
        // If navigator.onLine is available, use it, but don't trust it completely
        // Free WiFi often reports false even when connected
        return navigator.onLine !== false || typeof window !== 'undefined';
      }
      return true; // Assume online if we can't check
    } else {
      // For React Native
      const state = await NetInfo.fetch();
      // Be more lenient - if connected, assume internet is reachable
      // Free WiFi might not report isInternetReachable correctly
      return state.isConnected === true;
    }
  } catch (error) {
    // If check fails, assume online (optimistic) - chatbot can still work offline
    return true;
  }
};

// Get the best available server URL
const getApiUrl = async () => {
  try {
    // Web (browser) - Use localhost
    if (Platform.OS === 'web') {
      return 'http://localhost:8000/api';
    }

    // Mobile - Prioritize Ngrok URL from config
    const ngrokUrl = Constants.expoConfig?.extra?.ngrokUrl || 
                     Constants.expoConfig?.extra?.apiUrl?.replace('/api', '') ||
                     process.env.EXPO_PUBLIC_NGROK_URL;
    
    if (ngrokUrl && (ngrokUrl.includes('ngrok') || ngrokUrl.includes('https://'))) {
      const ngrokApiUrl = ngrokUrl.endsWith('/api') ? ngrokUrl : `${ngrokUrl}/api`;
      console.log(`🌐 Using Ngrok URL from config: ${ngrokApiUrl}`);
      return ngrokApiUrl;
    }

    // Try to discover server automatically using the standalone function
    console.log('Attempting server discovery...');
    const discoveredURL = await discoverBackendURL();
    
    if (discoveredURL) {
      console.log(`✅ Server discovered at ${discoveredURL}`);
      return discoveredURL;
    }

    // Fallback to default Ngrok URL (from app.config.js)
    const fallbackUrl = Constants.expoConfig?.extra?.apiUrl || 
                        'https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api';
    console.warn(`Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
  } catch (error) {
    console.error('Error in getApiUrl:', error);
    // Fallback to Ngrok URL
    return Constants.expoConfig?.extra?.apiUrl || 
           'https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api';
  }
};

// Initialize with Ngrok URL from config (will be updated by discovery)
const defaultNgrokUrl = Constants.expoConfig?.extra?.apiUrl || 
                         Constants.expoConfig?.extra?.ngrokUrl ? `${Constants.expoConfig.extra.ngrokUrl}/api` :
                         'https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api';
let API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:8000/api' : defaultNgrokUrl;

class ApiService {
  constructor() {
    this.offlineMode = false;
    this.healthCheckFailures = 0;
    this.maxHealthCheckFailures = 3; // Stop checking after 3 failures
    this.skipHealthChecks = false;
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 60 seconds for AI processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize network listeners
    this.initializeNetworkListeners();
    // Initial connection check (completely silent, non-blocking)
    // Don't wait for it, don't log errors - offline mode is expected
    this.checkAndUpdateConnection().catch(() => {
      // Completely silent - offline mode is OK
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        // Add ngrok bypass header for ngrok-free.dev (bypasses browser verification)
        if (config.baseURL && (config.baseURL.includes('ngrok-free.dev') || config.baseURL.includes('ngrok.io') || config.baseURL.includes('ngrok.app'))) {
          config.headers['ngrok-skip-browser-warning'] = 'true';
        }
        // Only log non-health-check requests
        if (!config.url?.includes('health')) {
          console.log('Making API request to:', config.baseURL + config.url);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Only log non-health-check requests
        if (!response.config?.url?.includes('health')) {
          console.log('API response received:', response.status);
        }
        return response;
      },
      (error) => {
        // Don't log health check errors - they're expected in offline mode
        if (!error.config?.url?.includes('health')) {
          console.log('API error:', {
            method: error.config?.method,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
          });
        }
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
      // Try /api/health/ endpoint (full path) with shorter timeout
      const healthUrl = this.api.defaults.baseURL.replace('/api', '') + '/api/health/';
      const response = await axios.get(healthUrl, {
        timeout: 2000, // Shorter timeout for faster failure
        validateStatus: (status) => status < 500,
        headers: { 'Accept': 'application/json' }
      });
      console.log('✅ Backend health check successful:', healthUrl, response.status);
      return response.status === 200;
    } catch (error) {
      // Silently fail - offline mode is OK, don't log errors
      // Also try the /health endpoint without /api prefix
      try {
        const altHealthUrl = this.api.defaults.baseURL.replace('/api', '') + '/health/';
        const altResponse = await axios.get(altHealthUrl, { 
          timeout: 2000, // Shorter timeout
          headers: { 'Accept': 'application/json' }
        });
        return altResponse.status === 200;
      } catch (altError) {
        // Silently return false - offline mode is expected
        return false;
      }
    }
  }

  // Auth endpoints
  async login(username, password) {
    try {
      // Ensure backend URL is discovered
      await this.ensureBackendURL();
      
      // Clean and prepare login data
      // Backend accepts both 'email' and 'username' fields
      const emailClean = username.trim().toLowerCase();
      const loginData = {
        email: emailClean,  // Use email field (matches backend API)
        username: emailClean, // Also include username for compatibility
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
          'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
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
      if (error.code === 'ECONNREFUSED' || 
          error.code === 'ENOTFOUND' || 
          error.code === 'ERR_NETWORK' ||
          error.code === 'ERR_CONNECTION_TIMED_OUT' ||
          error.message?.includes('Network Error') ||
          error.message?.includes('ERR_CONNECTION_TIMED_OUT')) {
        const backendURL = this.api.defaults.baseURL || 'http://192.168.103.243:8000/api';
        throw new Error(
          `Cannot connect to backend server at ${backendURL}.\n\n` +
          `Please check:\n` +
          `• Backend is running: python manage.py runserver 0.0.0.0:8000\n` +
          `• Device and computer are on the same WiFi network\n` +
          `• Windows Firewall allows port 8000\n` +
          `• Try accessing http://192.168.103.243:8000/api/health/ in your browser\n\n` +
          `You can still use offline mode if you've logged in before.`
        );
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Connection timeout. The server may be slow or unreachable. Please check your network connection and try again.');
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

  // Direct Django V1 chat endpoint (uses backend 3-mode router)
  async sendV1ChatMessage(query, language = 'english', sessionId = null, additionalData = {}) {
    // Backend expects 'message' field, not 'query'
    const payload = {
      message: query, // Use 'message' to match backend API
      language,
      ...additionalData,
    };
    if (sessionId) {
      payload.session_id = sessionId;
    }
    try {
      // Ensure backend URL is discovered (uses ngrok URL from app.json)
      await this.ensureBackendURL();
      
      // For web, always talk to backend on localhost:8000 to avoid stale LAN IPs
      if (Platform.OS === 'web') {
        this.api.defaults.baseURL = 'http://localhost:8000/api';
      }
      
      console.log('💬 Sending chat message to:', this.api.defaults.baseURL + '/v1/chat/');
      const response = await this.api.post('/v1/chat/', payload);
      
      // Transform response to match expected format
      // Backend returns: {status, response, language, mode}
      // Frontend expects: {text, message, data: {...}}
      if (response.data) {
        // If response is in new format {status, response, language, mode}
        if (response.data.status && response.data.response) {
          return {
            ...response,
            data: {
              ...response.data,
              text: response.data.response, // Map 'response' to 'text' for compatibility
              message: response.data.response, // Also map to 'message'
              // Preserve original fields
              status: response.data.status,
              language: response.data.language || language,
              mode: response.data.mode || 'online',
            }
          };
        }
        // If response already has 'text' or 'message', ensure both are present
        if (response.data.text && !response.data.message) {
          response.data.message = response.data.text;
        }
        if (response.data.message && !response.data.text) {
          response.data.text = response.data.message;
        }
      }
      
      return response;
    } catch (error) {
      // If the cached backend URL is dead, clear it and attempt rediscovery once
      if (error?.code === 'ERR_NETWORK') {
        try {
          await AsyncStorage.removeItem('backend_url');
        } catch (cacheErr) {
          console.warn('Failed to clear cached backend url:', cacheErr);
        }

        try {
          const newUrl = await discoverBackendURL();
          if (newUrl) {
            this.api.defaults.baseURL = newUrl;
            console.log('🔁 Retrying chat request using discovered backend:', newUrl);
            const retryResponse = await this.api.post('/v1/chat/', payload);
            
            // Transform response if needed
            if (retryResponse.data?.status && retryResponse.data?.response) {
              return {
                ...retryResponse,
                data: {
                  ...retryResponse.data,
                  text: retryResponse.data.response,
                  message: retryResponse.data.response,
                  status: retryResponse.data.status,
                  language: retryResponse.data.language || language,
                  mode: retryResponse.data.mode || 'online',
                }
              };
            }
            
            return retryResponse;
          }
        } catch (discoverErr) {
          console.warn('Backend discovery failed after network error:', discoverErr?.message || discoverErr);
        }
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
          ? "Hello! I'm your intelligent IT support assistant. I can help you with computer problems, software issues, network troubleshooting, and answer any tech questions you have!"
          : "Hello! I'm currently offline, but I can still help with basic campus information.",
        courses: "EVSU Dulag offers undergraduate programs in Education, Business Administration, and Computer Science. Each program has specific requirements and duration.",
        library: "The EVSU Dulag library is located on the main campus building. It provides study areas, books, and computer access for students.",
        facilities: "EVSU Dulag has various facilities including classrooms, library, computer lab, gymnasium, and cafeteria.",
        enrollment: "For enrollment information, please visit the Registrar's office when you're back online or contact them directly.",
        fallback: isWebDemo
          ? "I'm your IT support assistant! I can help with computer problems, software issues, network troubleshooting, and general tech support. What IT issue can I help you with today?"
          : "I'm currently offline. Here's some basic EVSU Dulag information: We offer programs in Education, Business, and Computer Science. The campus has a library, computer lab, and gymnasium. For more details, please try again when you're online."
      },
      bisaya: {
        greeting: "Kumusta! Offline ko karon, pero makatabang gihapon ko sa basic campus information.",
        courses: "Ang EVSU Dulag nag-offer og undergraduate programs sa Education, Business Administration, ug Computer Science.",
        library: "Ang library sa EVSU Dulag naa sa main campus building. Naa'y study areas, books, ug computer access.",
        facilities: "Ang EVSU Dulag naa'y mga facilities sama sa classrooms, library, computer lab, gymnasium, ug cafeteria.",
        enrollment: "Para sa enrollment info, adto sa Registrar's office kung online na ka o kontak sila direkta.",
        fallback: "Offline ko karon. Ania ang basic info sa EVSU Dulag: Naa'y programs sa Education, Business, ug Computer Science. Ang campus naa'y library, computer lab, ug gymnasium."
      },
      waray: {
        greeting: "Maupay nga adlaw! Offline ako karon, pero makakabulig pa ako han basic campus information.",
        courses: "An EVSU Dulag nag-offer hin undergraduate programs ha Education, Business Administration, ngan Computer Science.",
        library: "An library han EVSU Dulag naa ha main campus building. Mayda study areas, books, ngan computer access.",
        facilities: "An EVSU Dulag mayda mga facilities pareho han classrooms, library, computer lab, gymnasium, ngan cafeteria.",
        enrollment: "Para han enrollment info, kadto ha Registrar's office kun online na ka o kontak hira direkta.",
        fallback: "Offline ako karon. Ire an basic info han EVSU Dulag: Mayda programs ha Education, Business, ngan Computer Science. An campus mayda library, computer lab, ngan gymnasium."
      },
      tagalog: {
        greeting: "Kumusta! Offline ako ngayon, pero makakatulong pa rin ako sa basic campus information.",
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
      // Check if we already have a working URL (quick check with short timeout)
      if (this.api.defaults.baseURL) {
        try {
          const healthCheck = await Promise.race([
            axios.get(`${this.api.defaults.baseURL.replace('/api', '')}/api/health/`, {
              timeout: 3000, // Shorter timeout for quick check
              headers: { 'Accept': 'application/json' }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), 3000)
            )
          ]);
          if (healthCheck.status === 200) {
            console.log('✅ Current backend URL is working:', this.api.defaults.baseURL);
            return;
          }
        } catch (e) {
          console.log('⚠️ Current backend URL not working, discovering new one...');
        }
      }
      
      // Discover and set new URL (with timeout to prevent blocking)
      console.log('🔍 Discovering backend URL...');
      try {
        const discoveryPromise = discoverBackendURL();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Backend discovery timeout')), 10000) // 10 second max
        );
        
        const newUrl = await Promise.race([discoveryPromise, timeoutPromise]);
        
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
      } catch (discoveryError) {
        console.log('⚠️ Backend discovery timed out or failed, using fallback');
        // Continue with fallback URL
      }
    } catch (error) {
      console.error('❌ Error ensuring backend URL:', error);
      // Don't throw - use fallback URL
    }
    
    // Always ensure we have a baseURL set (fallback to Ngrok)
    if (!this.api.defaults.baseURL) {
      const fallbackURL = Constants.expoConfig?.extra?.apiUrl || 
                          (Constants.expoConfig?.extra?.ngrokUrl ? `${Constants.expoConfig.extra.ngrokUrl}/api` : null) ||
                          'https://unmutated-nondeprecatively-bonnie.ngrok-free.dev/api';
      this.api.defaults.baseURL = fallbackURL;
      API_BASE_URL = fallbackURL;
      console.log('⚠️ Using fallback URL:', fallbackURL);
    }
  }

  // Check and update connection status (silent, non-blocking)
  async checkAndUpdateConnection() {
    // Skip health checks if we've failed too many times
    if (this.skipHealthChecks) {
      return false;
    }
    
    try {
      const isConnected = await checkNetworkStatus();
      if (!isConnected) {
        return false;
      }

      // Try to update the base URL
      const newUrl = await getApiUrl();
      if (newUrl !== this.api.defaults.baseURL) {
        this.api.defaults.baseURL = newUrl;
        API_BASE_URL = newUrl;
      }

      // Verify the connection - try multiple health endpoints
      // Use a separate silent axios instance to avoid interceptors and browser console errors
      const silentAxios = axios.create({
        timeout: 1500, // Very short timeout
        validateStatus: () => true // Accept all status codes
      });
      
      // Remove any default interceptors
      silentAxios.interceptors.request.use(config => config);
      silentAxios.interceptors.response.use(response => response, error => Promise.reject(error));
      
      const healthEndpoints = [
        `${newUrl.replace('/api', '')}/api/health/`,
        `${newUrl.replace('/api', '')}/health/`,
        `${newUrl.replace('/api', '')}/health`,
        `${newUrl}/health`
      ];
      
      // Try endpoints in parallel with race condition - first success wins
      const healthChecks = healthEndpoints.map(endpoint => 
        silentAxios.get(endpoint).catch(() => null)
      );
      
      const results = await Promise.allSettled(healthChecks);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value?.status === 200) {
          // Success! Reset failure counter
          this.healthCheckFailures = 0;
          this.skipHealthChecks = false;
          return true;
        }
      }
      
      // All health checks failed
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= this.maxHealthCheckFailures) {
        this.skipHealthChecks = true;
        this.offlineMode = true;
      }
      
      return false;
    } catch (error) {
      // Completely silent - offline mode is expected
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= this.maxHealthCheckFailures) {
        this.skipHealthChecks = true;
        this.offlineMode = true;
      }
      return false;
    }
  }

  // Initialize network status listeners
  initializeNetworkListeners() {
    // Only initialize on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      try {
        window.addEventListener('online', () => {
          // Silently try to reconnect
          this.checkAndUpdateConnection().catch(() => {});
        });
        window.addEventListener('offline', () => {
          // Silently handle offline - expected behavior
        });
      } catch (error) {
        console.warn('Failed to initialize web network listeners:', error);
      }
    } else if (Platform.OS !== 'web') {
      // React Native network listener
      try {
        NetInfo.addEventListener(state => {
          if (state.isConnected) {
            // Silently try to reconnect
            this.checkAndUpdateConnection().catch(() => {});
          }
          // Silently handle offline - expected behavior
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
