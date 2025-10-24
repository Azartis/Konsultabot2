// Luma-inspired theme with holographic design
export const lumaTheme = {
  colors: {
    // Primary colors
    primary: '#4F8EFF',
    primaryGradientStart: '#5B8DEE',
    primaryGradientEnd: '#0047FF',
    
    // Background colors
    background: '#000000',
    surface: '#1A1A1A',
    card: '#1E1E1E',
    darkCard: '#0F0F0F',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#6B6B6B',
    
    // Accent colors for orb
    orbCyan: '#00FFF0',
    orbBlue: '#4F8EFF',
    orbPurple: '#8B5CF6',
    orbPink: '#FF3B9A',
    
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // UI elements
    border: '#2A2A2A',
    divider: '#1E1E1E',
    inputBackground: '#0A0A0A',
    
    // Chat bubbles
    userBubble: '#4F8EFF',
    aiBubble: '#1E1E1E',
    
    // Gradients
    gradientStart: '#1E3A8A',
    gradientMiddle: '#3B82F6',
    gradientEnd: '#60A5FA',
    
    // React Native Paper compatibility
    accent: '#4F8EFF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: '#FFFFFF',
    disabled: '#6B6B6B',
    placeholder: '#6B6B6B',
    notification: '#FF3B9A',
  },
  dark: true,
  
  gradients: {
    primary: ['#5B8DEE', '#0047FF'],
    orb: ['#00FFF0', '#4F8EFF', '#8B5CF6', '#FF3B9A'],
    header: ['#1E3A8A', '#3B82F6'],
    card: ['#1E1E1E', '#2A2A2A'],
    button: ['#4F8EFF', '#0047FF'],
  },
  
  shadows: {
    small: {
      shadowColor: '#4F8EFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#4F8EFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#4F8EFF',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#00FFF0',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
};

export default lumaTheme;
