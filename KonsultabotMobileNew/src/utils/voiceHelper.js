/**
 * Voice Helper - Mobile Speech Recognition
 * Uses @react-native-voice/voice for Android/iOS
 */
import { Platform, PermissionsAndroid } from 'react-native';
import * as Speech from 'expo-speech';

let Voice = null;
let isVoiceAvailable = false;

// Try to import Voice, but handle gracefully if not available
try {
  if (Platform.OS !== 'web') {
    // Import Voice module - try different import methods
    let VoiceModule;
    try {
      VoiceModule = require('@react-native-voice/voice');
    } catch (importError) {
      console.log('❌ Could not require Voice module:', importError.message);
      isVoiceAvailable = false;
    }
    
    if (VoiceModule) {
      // @react-native-voice/voice exports Voice as default
      Voice = VoiceModule.default || VoiceModule.Voice || VoiceModule;
      
      if (Voice && typeof Voice === 'object') {
        // Check if Voice has required methods
        if (typeof Voice.start === 'function' && typeof Voice.stop === 'function') {
          isVoiceAvailable = true;
          console.log('✅ Voice module loaded successfully');
          console.log('Voice methods available:', {
            start: typeof Voice.start,
            stop: typeof Voice.stop,
            cancel: typeof Voice.cancel,
            destroy: typeof Voice.destroy,
            isAvailable: typeof Voice.isAvailable,
            requestSpeechRecognitionPermission: typeof Voice.requestSpeechRecognitionPermission,
          });
        } else {
          console.warn('⚠️ Voice module loaded but missing required methods');
          console.warn('Voice object keys:', Object.keys(Voice || {}));
          isVoiceAvailable = false;
        }
      } else {
        console.warn('⚠️ Voice module is null, undefined, or not an object');
        console.warn('VoiceModule:', VoiceModule);
        isVoiceAvailable = false;
      }
    } else {
      console.warn('⚠️ VoiceModule is null or undefined');
      isVoiceAvailable = false;
    }
  }
} catch (error) {
  console.log('❌ Voice module not available:', error.message);
  console.log('Error stack:', error.stack);
  isVoiceAvailable = false;
}

export const VoiceHelper = {
  isAvailable: () => {
    const available = isVoiceAvailable && Voice !== null;
    if (!available) {
      console.log('VoiceHelper not available - Voice:', Voice, 'isVoiceAvailable:', isVoiceAvailable);
    } else {
      // Double-check that Voice methods are actually callable
      if (Voice && typeof Voice.start !== 'function') {
        console.warn('⚠️ Voice object exists but start method is not a function');
        return false;
      }
    }
    return available;
  },
  
  // Check if native module is actually linked
  checkNativeModule: async () => {
    if (!this.isAvailable()) {
      console.warn('⚠️ VoiceHelper not available for native module check');
      return false;
    }
    
    try {
      // Try to check if native module is available
      if (Voice && typeof Voice.isAvailable === 'function') {
        try {
          const available = await Voice.isAvailable();
          console.log('✅ Native module availability check:', available);
          return available;
        } catch (isAvailError) {
          // If isAvailable throws an error about null, the native module isn't linked
          if (isAvailError.message && isAvailError.message.includes('null')) {
            console.error('❌ Native module is null - not properly linked');
            return false;
          }
          throw isAvailError;
        }
      }
      // If isAvailable doesn't exist, try a simple property check
      // Check if Voice has the native module by trying to access a native property
      if (Voice && Voice._nativeModule) {
        console.log('✅ Native module detected via _nativeModule property');
        return true;
      }
      // Last resort: assume available if Voice object exists and has start method
      if (Voice && typeof Voice.start === 'function') {
        console.log('⚠️ Assuming native module is available (cannot verify)');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Native module check failed:', error);
      // If error mentions null, native module definitely isn't linked
      if (error.message && error.message.includes('null')) {
        return false;
      }
      // Otherwise, assume it might work
      return true;
    }
  },

  async requestAndroidPermission() {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions differently
    }
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Konsultabot needs access to your microphone for voice input.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Microphone permission granted');
        return true;
      } else {
        console.warn('⚠️ Microphone permission denied');
        return false;
      }
    } catch (err) {
      console.warn('⚠️ Permission request error:', err);
      return false;
    }
  },

  async start(locale = 'en-US') {
    if (!this.isAvailable()) {
      console.warn('❌ Voice recognition not available');
      return false;
    }
    
    try {
      // Request Android permissions first
      if (Platform.OS === 'android') {
        const hasPermission = await this.requestAndroidPermission();
        if (!hasPermission) {
          console.warn('⚠️ Android microphone permission denied');
          return false;
        }
      }
      
      // Also try Voice's own permission method if available
      if (typeof Voice.requestSpeechRecognitionPermission === 'function') {
        try {
          const permissionResult = await Voice.requestSpeechRecognitionPermission();
          console.log('Voice permission result:', permissionResult);
          if (permissionResult === false) {
            console.warn('⚠️ Speech recognition permission denied via Voice module');
            return false;
          }
        } catch (permError) {
          console.log('ℹ️ Voice permission method error (may already be granted):', permError.message);
          // Continue anyway - permission might already be granted
        }
      }
      
      // Check if Voice is available (some versions have this method)
      // Skip this check if it's known to fail with null errors
      if (typeof Voice.isAvailable === 'function') {
        try {
          const available = await Voice.isAvailable();
          console.log('Voice isAvailable check:', available);
        } catch (e) {
          // If error is about null, native module isn't linked - abort
          if (e.message && e.message.includes('null')) {
            console.error('❌ Native module is null - cannot start recognition');
            throw new Error('Native module not linked. Please rebuild the app with: npx expo prebuild --clean && npx expo run:android');
          }
          console.log('ℹ️ isAvailable check failed (continuing anyway):', e.message);
        }
      }
      
      // Verify Voice object is still valid before starting
      if (!Voice || typeof Voice.start !== 'function') {
        throw new Error('Voice module is not properly initialized. Native module may not be linked.');
      }
      
      // Start recognition
      console.log('🚀 Attempting to start Voice recognition with locale:', locale);
      try {
        await Voice.start(locale);
        console.log('✅ Voice recognition started successfully');
        return true;
      } catch (startError) {
        // If error mentions null or startSpeech, native module isn't linked
        if (startError.message && (startError.message.includes('null') || startError.message.includes('startSpeech'))) {
          throw new Error('Native module not linked. This requires a development build, not Expo Go. Run: npx expo prebuild --clean && npx expo run:android');
        }
        throw startError;
      }
    } catch (error) {
      console.error('❌ Voice start error:', error);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
      // Try to stringify error for more details
      try {
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (e) {
        console.error('Could not stringify error');
      }
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
      await Voice.cancel?.();
      await Voice.destroy?.();
      Voice.removeAllListeners?.();
    } catch (error) {
      console.error('Voice destroy error:', error);
    }
  },

  on(event, callback) {
    if (!this.isAvailable() || !Voice) {
      console.warn(`⚠️ Cannot add listener for ${event} - Voice not available`);
      return;
    }
    try {
      // Map event names to Voice event handler properties
      const eventMap = {
        'SpeechStart': 'onSpeechStart',
        'SpeechEnd': 'onSpeechEnd',
        'SpeechResults': 'onSpeechResults',
        'SpeechError': 'onSpeechError',
        'SpeechRecognized': 'onSpeechRecognized',
        'SpeechPartialResults': 'onSpeechPartialResults',
      };
      const voiceEvent = eventMap[event] || `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
      
      // Set the event handler directly on Voice object
      if (Voice[voiceEvent] !== undefined) {
        Voice[voiceEvent] = callback;
        console.log(`✅ Added listener for ${event} -> ${voiceEvent}`);
      } else {
        // Try to add it anyway - some versions might support dynamic assignment
        try {
          Voice[voiceEvent] = callback;
          console.log(`✅ Added listener for ${event} -> ${voiceEvent} (dynamic)`);
        } catch (e) {
          console.warn(`⚠️ Voice event handler ${voiceEvent} not found or cannot be set:`, e.message);
        }
      }
    } catch (error) {
      console.error(`❌ Voice on ${event} error:`, error);
    }
  },

  removeAllListeners() {
    if (!this.isAvailable() || !Voice) {
      return;
    }
    try {
      if (typeof Voice.removeAllListeners === 'function') {
        Voice.removeAllListeners();
      } else {
        // Manually remove listeners
        Voice.onSpeechStart = null;
        Voice.onSpeechEnd = null;
        Voice.onSpeechResults = null;
        Voice.onSpeechError = null;
        Voice.onSpeechRecognized = null;
        Voice.onSpeechPartialResults = null;
      }
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

