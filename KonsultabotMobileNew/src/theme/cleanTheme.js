import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    secondary: '#1E2328',
    accent: '#00D4FF',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceVariant: '#f0f0f0',
    text: '#1a1a1a',
    onSurface: '#1a1a1a',
    onBackground: '#1a1a1a',
    onSurfaceVariant: '#666666',
    placeholder: '#666666',
    disabled: '#e0e0e0',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    outline: '#e0e0e0',
    outlineVariant: '#f0f0f0',
    inverseSurface: '#1a1a1a',
    inverseOnSurface: '#ffffff',
    inversePrimary: '#ffffff',
    shadow: '#000000',
    scrim: '#000000',
    // Elevation levels (required by react-native-paper)
    elevation: {
      level0: '#ffffff',
      level1: '#f8f9fa',
      level2: '#f0f0f0',
      level3: '#e8e8e8',
      level4: '#e0e0e0',
      level5: '#d8d8d8',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  dark: false,
  roundness: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const shadows = {
  small: {
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  medium: {
    boxShadow: '0px 4px 4.65px rgba(0, 0, 0, 0.30)',
    elevation: 8,
  },
};
