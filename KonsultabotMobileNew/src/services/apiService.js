import axios from 'axios';
import Constants from 'expo-constants';

// Dynamic API URL configuration for web and mobile
const getApiUrl = () => {
  // Check if running in web browser
  if (typeof window !== 'undefined') {
    return 'http://localhost:8000/api';
  }
  
  // For mobile, try to get server info dynamically
  // Fallback to common IP addresses if needed
  const possibleIPs = [
    '192.168.1.17',
    '192.168.1.10', 
    '192.168.1.11',
    '192.168.0.100',
    '10.0.0.100'
  ];
  
  // Use the first IP as default, but this will be updated dynamically
  const defaultIP = possibleIPs[0];
  return `http://${defaultIP}:8000/api`;
};

const API_BASE_URL = getApiUrl();

console.log('API Base URL:', API_BASE_URL);

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Token ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('API Error:', {
          url: error.config?.url,
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

  // Chat endpoints
  async sendMessage(message, language = 'english', sessionId = null) {
    const payload = {
      message,
      language,
    };
    
    // Only include session_id if it's not null
    if (sessionId) {
      payload.session_id = sessionId;
    }
    
    return this.api.post('/chat/send/', payload);
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

  // Dynamic server discovery
  async discoverServer() {
    const possibleIPs = [
      '192.168.1.17',
      '192.168.1.10', 
      '192.168.1.11',
      '192.168.0.100',
      '10.0.0.100',
      '192.168.1.1',
      '192.168.0.1'
    ];

    for (const ip of possibleIPs) {
      try {
        const testUrl = `http://${ip}:8000/api/chat/server-info/`;
        const response = await axios.get(testUrl, { timeout: 3000 });
        
        if (response.status === 200 && response.data.status === 'success') {
          console.log(`✅ Found server at ${ip}:8000`);
          
          // Update the base URL
          this.api.defaults.baseURL = `http://${ip}:8000/api`;
          
          return {
            success: true,
            serverIP: ip,
            serverInfo: response.data
          };
        }
      } catch (error) {
        console.log(`❌ Server not found at ${ip}:8000`);
        continue;
      }
    }

    return {
      success: false,
      error: 'No server found on common IP addresses'
    };
  }

  // Auto-configure API service
  async autoConfig() {
    console.log('🔍 Auto-discovering server...');
    const result = await this.discoverServer();
    
    if (result.success) {
      console.log('✅ Server auto-configured:', result.serverInfo);
      return result;
    } else {
      console.log('❌ Auto-config failed, using default IP');
      return result;
    }
  }
}

export const apiService = new ApiService();
