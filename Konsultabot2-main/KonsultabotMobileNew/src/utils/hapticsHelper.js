/**
 * Haptics Helper - Expo Go Compatible
 * Provides fallback for expo-haptics when not available
 */
import { Platform } from 'react-native';

let Haptics = null;
let isHapticsAvailable = false;

try {
  if (Platform.OS !== 'web') {
    Haptics = require('expo-haptics');
    isHapticsAvailable = true;
  }
} catch (error) {
  console.log('Haptics not available');
  isHapticsAvailable = false;
}

export const HapticsHelper = {
  isAvailable: () => isHapticsAvailable && Haptics !== null,

  async impactAsync(style = 'Medium') {
    if (!this.isAvailable() || !Haptics) {
      return;
    }
    try {
      const styleMap = {
        'Light': Haptics.ImpactFeedbackStyle.Light,
        'Medium': Haptics.ImpactFeedbackStyle.Medium,
        'Heavy': Haptics.ImpactFeedbackStyle.Heavy,
      };
      await Haptics.impactAsync(styleMap[style] || Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Haptics error:', error);
    }
  },

  async notificationAsync(type = 'Success') {
    if (!this.isAvailable() || !Haptics) {
      return;
    }
    try {
      const typeMap = {
        'Success': Haptics.NotificationFeedbackType.Success,
        'Warning': Haptics.NotificationFeedbackType.Warning,
        'Error': Haptics.NotificationFeedbackType.Error,
      };
      await Haptics.notificationAsync(typeMap[type] || Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Haptics error:', error);
    }
  },
};

export default HapticsHelper;

