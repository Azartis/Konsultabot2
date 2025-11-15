// src/config/api.js
import { Platform } from 'react-native';
import { LOCAL_API_URL, PUBLIC_API_URL } from '@env';

let BASE_URL;

// Auto-detect whether running on web or mobile
if (Platform.OS === 'web') {
  BASE_URL = LOCAL_API_URL || 'http://127.0.0.1:8000/api/'; // Use localhost for web builds
} else {
  BASE_URL = PUBLIC_API_URL || 'https://your-ngrok-url.ngrok.io/api/'; // Use ngrok/public for mobile
}

console.log(`🌐 Platform: ${Platform.OS}`);
console.log(`🔗 API Base URL: ${BASE_URL}`);

export { BASE_URL };

// Example API functions
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function apiGet(endpoint) {
  try {
    const response = await fetchWithTimeout(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API GET error for ${endpoint}:`, error);
    throw error;
  }
}

export async function apiPost(endpoint, data) {
  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API POST error for ${endpoint}:`, error);
    throw error;
  }
}

export async function healthCheck() {
  try {
    const response = await fetchWithTimeout('health/', {}, 5000);
    return response.ok;
  } catch (error) {
    console.warn('Health check failed:', error.message);
    return false;
  }
}
