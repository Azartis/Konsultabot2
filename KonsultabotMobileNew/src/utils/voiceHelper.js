/**
 * Voice Helper - Mobile Speech Recognition
 * Uses @react-native-voice/voice for Android/iOS
 */
import { Platform, PermissionsAndroid } from 'react-native';

let Voice = null;
let isVoiceAvailable = false;
let nativeModuleLinked = false; // Track if native module is actually usable
let micPermissionGranted = false; // Cache microphone permission for this session

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
          nativeModuleLinked = true;
          console.log('✅ Voice module loaded successfully');
        } else {
          console.warn('⚠️ Voice module loaded but missing required methods');
          isVoiceAvailable = false;
          nativeModuleLinked = false;
        }
      } else {
        console.warn('⚠️ Voice module is null, undefined, or not an object');
        isVoiceAvailable = false;
        nativeModuleLinked = false;
      }
    } else {
      console.warn('⚠️ VoiceModule is null or undefined');
      isVoiceAvailable = false;
      nativeModuleLinked = false;
    }
  }
} catch (error) {
  console.log('❌ Voice module not available:', error.message);
  isVoiceAvailable = false;
  nativeModuleLinked = false;
}

export const VoiceHelper = {
  isAvailable: () => {
    const available = isVoiceAvailable && nativeModuleLinked && Voice !== null;
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
  
  async requestAndroidPermission() {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions differently
    }
    
    try {
      // If we've already granted permission in this session, skip re-checking
      if (micPermissionGranted) {
        return true;
      }
      // First check if permission is already granted
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      
      if (checkResult === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Microphone permission already granted');
        micPermissionGranted = true;
        return true;
      }
      
      // Only request if not already granted
      console.log('📱 Requesting microphone permission...');
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
        micPermissionGranted = true;
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
    if (!this.isAvailable() || !Voice) {
      console.warn('❌ Voice recognition not available');
      return false;
    }
    
    try {
      // Request Android permissions first (only if not already granted)
      if (Platform.OS === 'android') {
        const hasPermission = await this.requestAndroidPermission();
        if (!hasPermission) {
          console.warn('⚠️ Android microphone permission denied');
          return false;
        }
      }
      
      // Also try Voice's own permission method if available
      if (Voice && typeof Voice.requestSpeechRecognitionPermission === 'function') {
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
          // Mark module as not linked so future calls skip VoiceHelper entirely
          nativeModuleLinked = false;
          isVoiceAvailable = false;
          Voice = null;
          throw new Error('Native module not linked. This requires a development build, not Expo Go. Run: npx expo prebuild --clean && npx expo run:android');
        }
        throw startError;
      }
    } catch (error) {
      console.error('❌ Voice start error:', error);
      return false;
    }
  },

  async stop() {
    if (!this.isAvailable() || !Voice) {
      return false;
    }
    try {
      // Check if Voice.stop exists before calling
      if (typeof Voice.stop === 'function') {
        await Voice.stop();
        return true;
      } else {
        console.warn('⚠️ Voice.stop is not a function');
        return false;
      }
    } catch (error) {
      // If stop fails due to null native module, mark as unavailable to prevent repeats
      if (error?.message?.includes('null') || error?.message?.includes('stopSpeech')) {
        nativeModuleLinked = false;
        isVoiceAvailable = false;
        Voice = null;
      } else if (Voice !== null) {
        console.error('Voice stop error:', error);
      }
      return false;
    }
  },

  async destroy() {
    if (!this.isAvailable() || !Voice) {
      return;
    }
    try {
      if (typeof Voice.cancel === 'function') {
        await Voice.cancel();
      }
      if (typeof Voice.destroy === 'function') {
        await Voice.destroy();
      }
      if (typeof Voice.removeAllListeners === 'function') {
        Voice.removeAllListeners();
      }
    } catch (error) {
      // Don't log errors if Voice is null - this is expected in Expo Go
      if (Voice !== null) {
        console.error('Voice destroy error:', error);
      }
    }
  },

  on(event, callback) {
    // Early return if not available
    if (!this.isAvailable()) {
      return;
    }
    
    // Double-check Voice is not null
    if (!Voice) {
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
      
      // Check Voice exists again before accessing properties
      if (!Voice) {
        return;
      }
      
      // Set the event handler directly on Voice object
      try {
        if (Voice[voiceEvent] !== undefined) {
          Voice[voiceEvent] = callback;
          console.log(`✅ Added listener for ${event} -> ${voiceEvent}`);
        } else {
          // Try to add it anyway - some versions might support dynamic assignment
          Voice[voiceEvent] = callback;
          console.log(`✅ Added listener for ${event} -> ${voiceEvent} (dynamic)`);
        }
      } catch (setError) {
        // Silently ignore errors when Voice becomes null during assignment
        // This is expected in Expo Go where native modules aren't available
      }
    } catch (error) {
      // Silently ignore errors - expected when Voice is null
    }
  },

  removeAllListeners() {
    // Early return if Voice is not available or null
    if (!this.isAvailable()) {
      return;
    }
    
    // Double-check Voice is not null before proceeding
    if (!Voice) {
      return;
    }
    
    try {
      // Use the built-in removeAllListeners if available
      if (typeof Voice.removeAllListeners === 'function') {
        try {
          Voice.removeAllListeners();
          return;
        } catch (funcError) {
          // If function call fails, fall through to manual removal
          console.warn('⚠️ Voice.removeAllListeners() failed, trying manual removal');
        }
      }
      
      // Manually remove listeners - check Voice exists before each assignment
      if (Voice) {
        try {
          if (Voice.onSpeechStart !== undefined) Voice.onSpeechStart = null;
          if (Voice.onSpeechEnd !== undefined) Voice.onSpeechEnd = null;
          if (Voice.onSpeechResults !== undefined) Voice.onSpeechResults = null;
          if (Voice.onSpeechError !== undefined) Voice.onSpeechError = null;
          if (Voice.onSpeechRecognized !== undefined) Voice.onSpeechRecognized = null;
          if (Voice.onSpeechPartialResults !== undefined) Voice.onSpeechPartialResults = null;
        } catch (setError) {
          // Silently ignore errors when Voice becomes null during removal
          // This is expected in Expo Go where native modules aren't available
        }
      }
    } catch (error) {
      // Silently ignore all errors - this is expected when Voice is null in Expo Go
      // Don't log to avoid cluttering console with expected errors
    }
  },

  // Fallback: Use expo-speech for text-to-speech
  speak(text, options = {}) {
    try {
      const Speech = require('expo-speech');
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
      const Speech = require('expo-speech');
      Speech.stop();
    } catch (error) {
      console.error('Stop speech error:', error);
    }
  },
};

export default VoiceHelper;

