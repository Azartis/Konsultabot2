/**
 * Centralized Axios Instance for Mobile App
 * Handles all API communication with proper error handling and retry logic
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Get base URL from config or environment
const getBaseURL = () => {
  // Priority 1: Ngrok URL from environment/config
  const ngrokUrl = Constants.expoConfig?.extra?.ngrokUrl || 
                   process.env.EXPO_PUBLIC_NGROK_URL;
  
  if (ngrokUrl && typeof ngrokUrl === 'string' && 
      (ngrokUrl.includes('ngrok.io') || ngrokUrl.includes('ngrok-free.dev') || ngrokUrl.includes('ngrok.app'))) {
    return ngrokUrl.endsWith('/api') ? ngrokUrl : `${ngrokUrl}/api`;
  }
  
  // Priority 2: API URL from config
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (apiUrl) {
    return apiUrl;
  }
  
  // Priority 3: Metro bundler IP (for physical devices)
  if (Constants.expoConfig?.hostUri) {
    const ip = Constants.expoConfig.hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api`;
    }
  }
  
  // Priority 4: Platform-specific defaults
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api'; // Android emulator
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:8000/api'; // iOS simulator
  } else {
    // Web
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:8000/api`;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Configure retry logic
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  },
  onRetry: (retryCount, error) => {
    console.log(`[API] Retry attempt ${retryCount} for ${error.config?.url}`);
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API] Failed to get auth token:', error);
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your connection.';
      } else if (error.message === 'Network Error') {
        error.message = 'Network error. Please check your internet connection.';
      }
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - Token expired
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${getBaseURL().replace('/api', '')}/api/users/token/refresh/`,
            { refresh: refreshToken }
          );
          
          const { access } = response.data;
          await AsyncStorage.setItem('auth_token', access);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An error occurred';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Helper functions
export const apiGet = async (endpoint, config = {}) => {
  try {
    const response = await api.get(endpoint, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const apiPost = async (endpoint, data = {}, config = {}) => {
  try {
    const response = await api.post(endpoint, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const apiPut = async (endpoint, data = {}, config = {}) => {
  try {
    const response = await api.put(endpoint, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const apiDelete = async (endpoint, config = {}) => {
  try {
    const response = await api.delete(endpoint, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health/', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Get base URL (for other modules that need it)
export const getBaseURLValue = () => {
  return getBaseURL();
};

export default api;

