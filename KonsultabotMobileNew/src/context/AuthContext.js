import React, { createContext, useContext, useState, useEffect } from 'react';
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
        const userData = await AsyncStorage.getItem('user');
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (userData) {
          const user = JSON.parse(userData);
          setUser(user);
          // Restore auth token in API service
          if (accessToken) {
            apiService.setAuthToken(accessToken);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);
      const { access, refresh, user } = response.data;

      // Store tokens
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Set auth token in API service
      apiService.setAuthToken(access);

      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
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

      // Make API call to register user in backend database
      const response = await apiService.register(registrationData);

      if (response.status === 201) {
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
          error: response.data?.error || 'Registration failed with unexpected response'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Extract detailed error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.details) {
        // Backend validation errors
        const details = error.details;
        if (details.username) {
          errorMessage = `Username: ${details.username[0]}`;
        } else if (details.email) {
          errorMessage = `Email: ${details.email[0]}`;
        } else if (details.password) {
          errorMessage = `Password: ${details.password[0]}`;
        } else if (details.password_confirm) {
          errorMessage = `Confirmation: ${details.password_confirm[0]}`;
        } else if (details.non_field_errors) {
          errorMessage = details.non_field_errors[0];
        } else {
          errorMessage = JSON.stringify(details);
        }
      } else if (error.message) {
        errorMessage = error.message;
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
      // Call logout API endpoint
      await apiService.logout();

      // Clear stored data
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setUser(null);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local storage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setUser(null);
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
