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
        if (userData) {
          setUser(JSON.parse(userData));
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
      // Test accounts for demo
      const testAccounts = {
        'admin@evsu.edu.ph': {
          password: 'admin123',
          user: {
            id: 1,
            email: 'admin@evsu.edu.ph',
            username: 'admin',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin'
          }
        },
        'student@evsu.edu.ph': {
          password: 'student123',
          user: {
            id: 2,
            email: 'student@evsu.edu.ph',
            username: 'student',
            first_name: 'Student',
            last_name: 'User',
            role: 'student'
          }
        },
        'itstaff@evsu.edu.ph': {
          password: 'staff123',
          user: {
            id: 3,
            email: 'itstaff@evsu.edu.ph',
            username: 'itstaff',
            first_name: 'IT Staff',
            last_name: 'User',
            role: 'it_staff'
          }
        }
      };

      const account = testAccounts[email];
      if (!account || account.password !== password) {
        return { success: false, error: 'Invalid email or password' };
      }

      const userData = account.user;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to login' };
    }
  };

  const register = async (formData) => {
    try {
      // Prepare registration data for backend API
      const registrationData = {
        username: formData.student_id,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'student',
        department: formData.course || 'Computer Science',
        student_id: formData.student_id,
        year_level: formData.year_level || '1st Year'
      };

      // Make API call to register user in backend database
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Registration successful, now login the user
        const loginResult = await login(formData.email, formData.password);
        return loginResult;
      } else {
        return { 
          success: false, 
          error: data.error || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check if the server is running.' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('access_token');
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      return userData ? JSON.parse(userData) : null;
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
