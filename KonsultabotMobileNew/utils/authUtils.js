/**
 * Authentication utilities for KonsultaBot RBAC
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API Configuration - Django Authentication Server
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/auth'
  : 'https://your-production-domain.com/api/auth';

/**
 * Get stored authentication data
 */
export const getAuthData = async () => {
  try {
    const [accessToken, refreshToken, userRole, userData] = await AsyncStorage.multiGet([
      'access_token',
      'refresh_token', 
      'user_role',
      'user_data'
    ]);

    return {
      accessToken: accessToken[1],
      refreshToken: refreshToken[1],
      userRole: userRole[1],
      userData: userData[1] ? JSON.parse(userData[1]) : null
    };
  } catch (error) {
    console.error('Error getting auth data:', error);
    return {
      accessToken: null,
      refreshToken: null,
      userRole: null,
      userData: null
    };
  }
};

/**
 * Store authentication data
 */
export const storeAuthData = async (accessToken, refreshToken, userRole, userData) => {
  try {
    await AsyncStorage.multiSet([
      ['access_token', accessToken],
      ['refresh_token', refreshToken],
      ['user_role', userRole],
      ['user_data', JSON.stringify(userData)]
    ]);
    return true;
  } catch (error) {
    console.error('Error storing auth data:', error);
    return false;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'access_token',
      'refresh_token',
      'user_role',
      'user_data'
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const { accessToken } = await getAuthData();
  return !!accessToken;
};

/**
 * Check user role
 */
export const getUserRole = async () => {
  const { userRole } = await getAuthData();
  return userRole;
};

/**
 * Check if user has specific role
 */
export const hasRole = async (requiredRole) => {
  const userRole = await getUserRole();
  return userRole === requiredRole;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = async (requiredRoles) => {
  const userRole = await getUserRole();
  return requiredRoles.includes(userRole);
};

/**
 * Check if user can access dashboard
 */
export const canAccessDashboard = async () => {
  return await hasAnyRole(['admin', 'it_staff']);
};

/**
 * Check if user can edit knowledge base
 */
export const canEditKnowledgeBase = async () => {
  return await hasAnyRole(['admin', 'it_staff']);
};

/**
 * Check if user can view analytics
 */
export const canViewAnalytics = async () => {
  return await hasAnyRole(['admin', 'it_staff']);
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  try {
    const { refreshToken } = await getAuthData();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      refresh: refreshToken
    });

    const { access } = response.data;
    
    if (!access) {
      throw new Error('No access token in refresh response');
    }

    // Update stored access token
    await AsyncStorage.setItem('access_token', access);
    
    return access;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear auth data if refresh fails
    await clearAuthData();
    throw error;
  }
};

/**
 * Login user
 */
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login/`, {
      username,
      password
    });
    
    const { access, refresh, user } = response.data;
    await storeAuthData(access, refresh, user.role, user);
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create authenticated axios instance
 */
export const createAuthenticatedAxios = async () => {
  const { accessToken } = await getAuthData();
  
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` })
    }
  });

  // Add request interceptor to handle token refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newAccessToken = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    const { refreshToken } = await getAuthData();
    
    if (refreshToken) {
      // Try to blacklist the refresh token
      try {
        await axios.post(`${API_BASE_URL}/logout/`, {
          refresh: refreshToken
        });
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }
    }
    
    // Clear local auth data
    await clearAuthData();
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local data even if API call fails
    await clearAuthData();
    return false;
  }
};

/**
 * Get user permissions
 */
export const getUserPermissions = async () => {
  try {
    const axiosInstance = await createAuthenticatedAxios();
    const response = await axiosInstance.get('/permissions/');
    return response.data.permissions || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (permission) => {
  const permissions = await getUserPermissions();
  return permissions.includes(permission);
};

/**
 * Get user profile
 */
export const getUserProfile = async () => {
  try {
    const axiosInstance = await createAuthenticatedAxios();
    const response = await axiosInstance.get('/profile/');
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const axiosInstance = await createAuthenticatedAxios();
    const response = await axiosInstance.put('/profile/', profileData);
    
    // Update stored user data
    await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (oldPassword, newPassword, newPasswordConfirm) => {
  try {
    const axiosInstance = await createAuthenticatedAxios();
    const response = await axiosInstance.post('/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm
    });
    
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Role-based navigation helper
 */
export const getInitialRoute = async () => {
  try {
    const isAuth = await isAuthenticated();
    
    if (!isAuth) {
      return 'LoginScreen';
    }
    
    const userRole = await getUserRole();
    
    switch (userRole) {
      case 'admin':
      case 'it_staff':
        return 'AdminDashboard';
      case 'student':
      default:
        return 'AdvancedChatScreen';
    }
  } catch (error) {
    console.error('Error determining initial route:', error);
    return 'LoginScreen';
  }
};

/**
 * Role display names
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    'admin': 'Administrator',
    'it_staff': 'IT Staff',
    'student': 'Student'
  };
  
  return roleNames[role] || role;
};

/**
 * Role colors for UI
 */
export const getRoleColor = (role) => {
  const roleColors = {
    'admin': '#DC3545',     // Red
    'it_staff': '#28A745',  // Green
    'student': '#007BFF'    // Blue
  };
  
  return roleColors[role] || '#6C757D';
};
