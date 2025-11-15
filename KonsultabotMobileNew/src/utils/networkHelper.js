/**
 * Network Helper - Get device IP and discover backend
 */
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

/**
 * Get the computer's IP address for backend connection
 * This is needed when running on a physical device via Expo Go
 */
export const getBackendURL = async () => {
  try {
    // For web, always use localhost
    if (Platform.OS === 'web') {
      return 'http://localhost:8000/api';
    }

    // For Android emulator
    if (Platform.OS === 'android' && __DEV__) {
      // Check if running in emulator (10.0.2.2 is emulator's localhost)
      return 'http://10.0.2.2:8000/api';
    }

    // For physical devices, try to discover backend
    const possibleIPs = [
      '192.168.1.17',
      '192.168.0.17',
      '192.168.1.100',
      '192.168.0.100',
      '10.0.0.17',
      '10.143.17.242',
      '172.20.10.2',
    ];

    // Try each IP
    for (const ip of possibleIPs) {
      try {
        const url = `http://${ip}:8000/api/health/`;
        const response = await axios.get(url, {
          timeout: 2000,
          validateStatus: (status) => status < 500,
        });
        
        if (response.status === 200 || response.status === 404) {
          // Backend is reachable (404 is OK, means server is running)
          console.log(`✅ Found backend at: http://${ip}:8000/api`);
          return `http://${ip}:8000/api`;
        }
      } catch (error) {
        // Continue to next IP
        continue;
      }
    }

    // Fallback - return most common IP
    console.log('⚠️ Backend not found, using fallback IP');
    return 'http://192.168.1.17:8000/api';
  } catch (error) {
    console.error('Error getting backend URL:', error);
    return Platform.OS === 'web' 
      ? 'http://localhost:8000/api' 
      : 'http://192.168.1.17:8000/api';
  }
};

/**
 * Check if backend is available
 */
export const checkBackendHealth = async (baseURL) => {
  try {
    const response = await axios.get(`${baseURL.replace('/api', '')}/api/health/`, {
      timeout: 3000,
      validateStatus: (status) => status < 500,
    });
    return response.status === 200 || response.status === 404;
  } catch (error) {
    return false;
  }
};

