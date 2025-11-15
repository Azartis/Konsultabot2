/**
 * Voice Helper - Expo Go Compatible
 * Provides fallback for @react-native-voice/voice when running in Expo Go
 */
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

let Voice = null;
let isVoiceAvailable = false;

// Try to import Voice, but handle gracefully if not available
try {
  if (Platform.OS !== 'web') {
    Voice = require('@react-native-voice/voice').default;
    isVoiceAvailable = true;
  }
} catch (error) {
  console.log('Voice module not available, using fallback');
  isVoiceAvailable = false;
}

export const VoiceHelper = {
  isAvailable: () => isVoiceAvailable && Voice !== null,

  async start(locale = 'en-US') {
    if (!this.isAvailable()) {
      console.warn('Voice recognition not available in Expo Go');
      return false;
    }
    try {
      await Voice.start(locale);
      return true;
    } catch (error) {
      console.error('Voice start error:', error);
      return false;
    }
  },

  async stop() {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      await Voice.stop();
      return true;
    } catch (error) {
      console.error('Voice stop error:', error);
      return false;
    }
  },

  async destroy() {
    if (!this.isAvailable()) {
      return;
    }
    try {
      await Voice.destroy();
      Voice.removeAllListeners();
    } catch (error) {
      console.error('Voice destroy error:', error);
    }
  },

  on(event, callback) {
    if (!this.isAvailable() || !Voice) {
      return;
    }
    try {
      // Map event names to Voice event handlers
      const eventMap = {
        'SpeechStart': 'onSpeechStart',
        'SpeechEnd': 'onSpeechEnd',
        'SpeechResults': 'onSpeechResults',
        'SpeechError': 'onSpeechError',
        'SpeechRecognized': 'onSpeechRecognized',
      };
      const voiceEvent = eventMap[event] || `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
      Voice[voiceEvent] = callback;
    } catch (error) {
      console.error(`Voice on ${event} error:`, error);
    }
  },

  removeAllListeners() {
    if (!this.isAvailable() || !Voice) {
      return;
    }
    try {
      Voice.removeAllListeners();
    } catch (error) {
      console.error('Voice removeAllListeners error:', error);
    }
  },

  // Fallback: Use expo-speech for text-to-speech
  speak(text, options = {}) {
    try {
      Speech.speak(text, {
        language: options.language || 'en',
        pitch: options.pitch || 1.0,
        rate: options.rate || 0.75,
        ...options,
      });
    } catch (error) {
      console.error('Speech error:', error);
    }
  },

  stopSpeaking() {
    try {
      Speech.stop();
    } catch (error) {
      console.error('Stop speech error:', error);
    }
  },
};

export default VoiceHelper;

