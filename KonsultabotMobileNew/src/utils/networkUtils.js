import { useState, useEffect } from 'react';
import axios from 'axios';

// Check internet connectivity
export const checkInternetConnection = async () => {
  // For web, use navigator.onLine as primary check
  if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
    return navigator.onLine;
  }
  
  // Fallback: try to reach a reliable endpoint
  try {
    const response = await fetch('https://www.google.com/favicon.ico', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Check backend API connectivity
export const checkBackendConnection = async (baseURL = 'http://localhost:8000') => {
  try {
    const response = await axios.get(`${baseURL}/api/health/`, { 
      timeout: 3000 
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Hook for network status
export const useNetworkStatus = () => {
  // Start optimistic - assume online
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  useEffect(() => {
    // Check immediately on mount
    setTimeout(() => checkConnectivity(), 1000);

    // Check every 30 seconds
    const interval = setInterval(checkConnectivity, 30000);

    // Listen to online/offline events (web only)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const checkConnectivity = async () => {
    // Step 1: Check internet
    const internetStatus = await checkInternetConnection();
    console.log('[NetworkUtils] Internet check:', internetStatus ? '✅ Online' : '❌ Offline');
    setIsOnline(internetStatus);

    if (internetStatus) {
      // Step 2: Check backend
      const backendStatus = await checkBackendConnection();
      console.log('[NetworkUtils] Backend check:', backendStatus ? '✅ Connected' : '❌ Down');
      setIsBackendOnline(backendStatus);
    } else {
      setIsBackendOnline(false);
    }
  };

  const handleOnline = () => {
    checkConnectivity();
  };

  const handleOffline = () => {
    setIsOnline(false);
    setIsBackendOnline(false);
  };

  return { isOnline, isBackendOnline, checkConnectivity };
};
