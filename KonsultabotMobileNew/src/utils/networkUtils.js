import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
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
  const [lastLoggedStatus, setLastLoggedStatus] = useState({ online: null, backend: null });

  const checkConnectivity = async () => {
    // Step 1: Check internet
    const internetStatus = await checkInternetConnection();
    
    // Only log if status changed
    if (internetStatus !== lastLoggedStatus.online) {
      console.log('[NetworkUtils] Internet check:', internetStatus ? '✅ Online' : '❌ Offline');
      setLastLoggedStatus(prev => ({ ...prev, online: internetStatus }));
    }
    setIsOnline(internetStatus);

    if (internetStatus) {
      // Step 2: Check backend
      const backendStatus = await checkBackendConnection();
      
      // Only log if status changed
      if (backendStatus !== lastLoggedStatus.backend) {
        console.log('[NetworkUtils] Backend check:', backendStatus ? '✅ Connected' : '❌ Down');
        setLastLoggedStatus(prev => ({ ...prev, backend: backendStatus }));
      }
      setIsBackendOnline(backendStatus);
    } else {
      if (lastLoggedStatus.backend !== false) {
        setLastLoggedStatus(prev => ({ ...prev, backend: false }));
      }
      setIsBackendOnline(false);
    }
  };

  const handleOnline = () => {
    checkConnectivity();
  };

  const handleOffline = () => {
    setIsOnline(false);
    setIsBackendOnline(false);
    setLastLoggedStatus({ online: false, backend: false });
  };

  useEffect(() => {
    // Check immediately on mount
    setTimeout(() => checkConnectivity(), 1000);

    // Check every 30 seconds (reduced from constant checking)
    const interval = setInterval(checkConnectivity, 30000);

    // Listen to online/offline events (web only)
    // Only add listeners if we're on web platform and window.addEventListener exists
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      try {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
      } catch (error) {
        console.warn('Failed to add network event listeners:', error);
      }
    }

    return () => {
      clearInterval(interval);
      // Only remove listeners if we're on web platform and window.removeEventListener exists
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.removeEventListener) {
        try {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        } catch (error) {
          console.warn('Failed to remove network event listeners:', error);
        }
      }
    };
  }, []);

  return { isOnline, isBackendOnline, checkConnectivity };
};
