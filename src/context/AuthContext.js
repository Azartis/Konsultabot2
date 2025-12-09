import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

// Ensure Buffer is available in React Native environment
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = Buffer;
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/apiService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        console.log('🔐 Checking authentication...');
        
        const userData = await AsyncStorage.getItem('user');
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        if (userData) {
          try {
            const user = JSON.parse(userData);
            setUser(user);
            console.log('✅ User found in storage:', user.email || user.username);
            
            // Restore auth token in API service
            if (accessToken) {
              apiService.setAuthToken(accessToken);
              console.log('✅ Auth token restored');
            }
          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
            // Clear corrupted data
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('accessToken');
          }
        } else {
          console.log('ℹ️ No user found in storage');
        }
      } catch (error) {
        console.error('❌ Error checking auth:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ Auth check complete');
      }
    };
    
    // Small delay to ensure AsyncStorage is ready
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Validate input
      if (!email || !password) {
        return { success: false, error: 'Please enter both email and password' };
      }
      
      // Check network status
      const NetInfo = require('@react-native-community/netinfo').default;
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      // Try online login first
      try {
        const response = await apiService.login(email, password);
        
        // Handle different response formats
        const accessToken = response.data?.access || response.data?.access_token || response.data?.token;
        const refreshToken = response.data?.refresh || response.data?.refresh_token;
        const userData = response.data?.user || response.data;
        
        if (!accessToken) {
          throw new Error(response.data?.error || response.data?.message || 'Login failed. Invalid response from server.');
        }

        // Store tokens and user data
        await AsyncStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        // Store credentials for offline login (simple hash for verification)
        await AsyncStorage.setItem('cachedEmail', email.toLowerCase().trim());
        // Use a simple hash that works in both web and React Native
        const passwordHash = Platform.OS === 'web' 
          ? btoa(password).substring(0, 20)
          : Buffer.from(password).toString('base64').substring(0, 20);
        await AsyncStorage.setItem('cachedPasswordHash', passwordHash);

        // Set auth token in API service
        apiService.setAuthToken(accessToken);

        setUser(userData);
        return { success: true };
      } catch (onlineError) {
        console.log('Online login failed:', onlineError.message);
        
        // If offline or connection error, try offline login
        if (!isConnected || 
            onlineError.code === 'ECONNREFUSED' || 
            onlineError.code === 'ENOTFOUND' || 
            onlineError.message?.includes('Network Error') ||
            onlineError.message?.includes('Cannot connect to server')) {
          
          console.log('📴 Attempting offline login...');
          
          // Check if we have cached credentials
          const cachedEmail = await AsyncStorage.getItem('cachedEmail');
          const cachedPasswordHash = await AsyncStorage.getItem('cachedPasswordHash');
          
          if (cachedEmail && cachedEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
            // Verify password hash matches
            const passwordHash = Platform.OS === 'web'
              ? btoa(password).substring(0, 20)
              : Buffer.from(password).toString('base64').substring(0, 20);
            if (cachedPasswordHash === passwordHash) {
              // Check if we have cached user data
              const cachedUserData = await AsyncStorage.getItem('user');
              if (cachedUserData) {
                try {
                  const user = JSON.parse(cachedUserData);
                  setUser(user);
                  console.log('✅ Offline login successful with cached credentials');
                  return { 
                    success: true, 
                    offline: true,
                    message: 'Logged in successfully. All features are available!'
                  };
                } catch (parseError) {
                  console.error('Error parsing cached user data:', parseError);
                }
              }
            }
          }
          
          // If offline login fails, return helpful error
          return { 
            success: false, 
            error: 'Cannot connect to server. Please check:\n\n• Backend is running on port 8000\n• Device is on the same network\n• Firewall allows port 8000\n\nOr use previously logged-in account for offline mode.',
            offline: true
          };
        }
        
        // For other errors (invalid credentials, etc.), return the original error
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (onlineError.message) {
          errorMessage = onlineError.message;
        } else if (onlineError.response?.data?.error) {
          errorMessage = onlineError.response.data.error;
        } else if (onlineError.response?.data?.message) {
          errorMessage = onlineError.response.data.message;
        } else if (onlineError.response?.data?.detail) {
          errorMessage = onlineError.response.data.detail;
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred during login.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    try {
      setIsLoading(true);

      // Validate required fields
      const requiredFields = ['student_id', 'email', 'password', 'first_name', 'last_name'];
      for (const field of requiredFields) {
        if (!formData[field]?.trim()) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate email format
      if (!formData.email.toLowerCase().includes('@evsu.edu.ph')) {
        throw new Error('Please use your EVSU email address (@evsu.edu.ph)');
      }

      // Prepare registration data for backend API
      const registrationData = {
        username: formData.email.toLowerCase().trim(), // Use email as username for login consistency
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        password_confirm: formData.password_confirm, // Required by backend
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        department: formData.course?.trim() || 'Computer Science',
        student_id: formData.student_id.trim(),
        phone_number: formData.phone_number?.trim() || ''
      };

      // Ensure backend URL is discovered
      await apiService.ensureBackendURL();
      
      // Make API call to register user in backend database
      const response = await apiService.register(registrationData);

      if (response.status === 201 || response.status === 200) {
        // Registration successful, now login the user
        console.log('Registration successful, attempting auto-login...');
        const loginResult = await login(registrationData.username, registrationData.password);
        
        if (loginResult.success) {
          console.log('Auto-login after registration successful');
          return { success: true };
        } else {
          console.warn('Auto-login failed:', loginResult.error);
          return {
            success: true,
            message: 'Registration successful! Please login with your credentials.'
          };
        }
      } else {
        console.error('Unexpected response status:', response.status);
        return {
          success: false,
          error: response.data?.error || response.data?.message || 'Registration failed with unexpected response'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Extract detailed error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        // Backend validation errors
        const details = error.details;
        if (details.username) {
          errorMessage = `Username: ${Array.isArray(details.username) ? details.username[0] : details.username}`;
        } else if (details.email) {
          errorMessage = `Email: ${Array.isArray(details.email) ? details.email[0] : details.email}`;
        } else if (details.password) {
          errorMessage = `Password: ${Array.isArray(details.password) ? details.password[0] : details.password}`;
        } else if (details.password_confirm) {
          errorMessage = `Password confirmation: ${Array.isArray(details.password_confirm) ? details.password_confirm[0] : details.password_confirm}`;
        } else if (details.non_field_errors) {
          errorMessage = Array.isArray(details.non_field_errors) ? details.non_field_errors[0] : details.non_field_errors;
        } else if (typeof details === 'string') {
          errorMessage = details;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // IMPORTANT: Save chat history BEFORE clearing user data
      // Get user ID before clearing user data
      const currentUser = user;
      const userId = currentUser?.id;

      // Ensure chat history is saved before logout
      // The ChatHistoryContext will handle saving, but we give it a moment
      if (userId) {
        try {
          // Small delay to ensure any pending saves complete
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('✅ Chat history preserved for user:', userId);
        } catch (chatError) {
          console.warn('Error ensuring chat history is saved:', chatError);
        }
      }

      // Call logout API endpoint
      await apiService.logout();

      // Clear stored authentication data (but NOT chat history - preserve it for next login)
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setUser(null);

      // NOTE: We do NOT clear chat_history_${userId} here
      // Chat history is preserved so user can see it when they log back in
      // It will only be cleared if user explicitly requests it or account is deleted

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local storage
      // But still preserve chat history
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setUser(null);
      
      // NOTE: Chat history is preserved even on error logout
      return { success: true };
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('user');
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);

        // Restore auth token in API service
        if (accessToken) {
          apiService.setAuthToken(accessToken);
        }

        return user;
      }
      return null;
    } catch (error) {
      console.error('Error checking auth:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      const updatedUser = response.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
        updateProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
