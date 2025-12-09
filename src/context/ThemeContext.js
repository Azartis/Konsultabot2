import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lumaTheme } from '../theme/lumaTheme';
import { theme as lightTheme } from '../theme/cleanTheme';

const SETTINGS_STORAGE_KEY = '@konsultabot_settings';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeMode] = useState('dark'); // 'light' | 'dark' | 'auto'
  const [isLoading, setIsLoading] = useState(true);

  // Create light theme variant
  const lightThemeVariant = {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      // Elevation levels for light theme
      elevation: {
        level0: '#ffffff',
        level1: '#f8f9fa',
        level2: '#f0f0f0',
        level3: '#e8e8e8',
        level4: '#e0e0e0',
        level5: '#d8d8d8',
      },
    },
    dark: false,
  };

  // Determine the actual theme to use
  const getActiveTheme = () => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? lumaTheme : lightThemeVariant;
    }
    return themeMode === 'dark' ? lumaTheme : lightThemeVariant;
  };

  const activeTheme = getActiveTheme();

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.theme) {
            setThemeMode(parsed.theme);
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Update theme mode
  const updateThemeMode = async (mode) => {
    try {
      setThemeMode(mode);
      // Save to storage
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      settings.theme = mode;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value = {
    theme: activeTheme,
    themeMode,
    updateThemeMode,
    isDark: activeTheme.dark,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

