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
    text: '#1a1a1a',
    onSurface: '#1a1a1a',
    onBackground: '#1a1a1a',
    placeholder: '#666666',
    disabled: '#e0e0e0',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: configureFonts({ config: fontConfig }),
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
