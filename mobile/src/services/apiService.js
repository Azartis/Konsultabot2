import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = 'http://localhost:8000';
const MOBILE_API_KEY = Constants.expoConfig?.extra?.apiKey || null;

class ApiService {
  constructor() {
    this.initializeApi();
  }

  async initializeApi() {
    try {
      this.api = axios.create({
        baseURL: BASE_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...(MOBILE_API_KEY ? { 'X-API-KEY': MOBILE_API_KEY } : {}),
        },
      });

      this._setupInterceptors();
      console.log('API Service initialized with base URL:', BASE_URL);
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      throw error;
    }
  }

  _setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('userToken');
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username, password) {
    try {
      console.log('Attempting login for:', username);
      const response = await this.api.post('/api/auth/login/', { username, password });
      
      // Check for either token or access token (JWT)
      const token = response.data.token || response.data.access;
      if (token) {
        await AsyncStorage.setItem('userToken', token);
        console.log('Login successful');
      }
      return response;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      if (error.response?.data) {
        // Pass through the server's error message
        throw new Error(
          error.response.data.detail || 
          error.response.data.message || 
          error.response.data.non_field_errors?.[0] ||
          'Invalid username or password'
        );
      }
      throw error;
    }
  }

  async register(username, email, password, password_confirm = null, first_name = '', last_name = '') {
    try {
      const response = await this.api.post('/api/auth/register/', {
        username,
        email,
        password,
        password_confirm: password_confirm || password,
        first_name,
        last_name,
      });
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
      }
      return response;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('userToken');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Chat endpoints
  async sendMessage(message, language = 'english', sessionId = null) {
    try {
      console.log('Sending message:', { message, language, sessionId });
      const response = await this.api.post('/api/v1/chat/', {
        query: message,
        language,
        session_id: sessionId,
        voice_response: false
      });
      console.log('Chat response:', response.data);
      return response;
    } catch (error) {
      console.error('Send message error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getConversationHistory(sessionId = null) {
    try {
      const url = sessionId ? `/api/v1/chat/history/${sessionId}/` : '/api/v1/chat/history/';
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get history error:', error.response?.data || error.message);
      throw error;
    }
  }

  async askGemini(message, context = null) {
    try {
      const response = await this.api.post('/api/v1/chat/gemini/', {
        query: message,
        context: context
      });
      return response.data;
    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async translateText(text, targetLang = 'English') {
    try {
      const response = await this.api.post('/api/v1/chat/gemini/translate/', {
        text,
        target_lang: targetLang
      });
      return response.data;
    } catch (error) {
      console.error('Translation error:', error.response?.data || error.message);
      throw error;
    }
  }

  async generateImage(prompt) {
    try {
      const response = await this.api.post('/api/v1/chat/gemini/image/', {
        prompt
      });
      return response.data;
    } catch (error) {
      console.error('Image generation error:', error.response?.data || error.message);
      throw error;
    }
  }

  async testGemini(message) {
    try {
      const response = await this.api.post('/api/chat/test-gemini/', { message });
      return response;
    } catch (error) {
      console.error('Test Gemini error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ApiService();