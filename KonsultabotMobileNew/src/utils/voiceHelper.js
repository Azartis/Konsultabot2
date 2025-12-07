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
    // First check if Voice is null or undefined
    if (Voice === null || Voice === undefined) {
      console.log('VoiceHelper not available - Voice is null/undefined (native module not linked)');
      return false;
    }
    
    // Check if Voice is actually an object
    if (typeof Voice !== 'object') {
      console.log('VoiceHelper not available - Voice is not an object:', typeof Voice);
      return false;
    }
    
    // Check if required methods exist
    if (typeof Voice.start !== 'function' || typeof Voice.stop !== 'function') {
      console.warn('⚠️ Voice object exists but missing required methods');
        return false;
      }
    
    // Check if native module is actually linked (not just the JS wrapper)
    // First ensure Voice is not null before accessing any properties
    if (Voice === null || Voice === undefined) {
      return false;
    }
    
    try {
      // Try to access a property that would only exist if native module is linked
      // Use optional chaining to safely access _nativeModule
      if (Voice._nativeModule === null || Voice._nativeModule === undefined) {
        // This might still work, so we'll try to call isAvailable if it exists
        // But we won't throw - we'll just return false
        console.log('⚠️ Voice native module may not be linked');
      }
    } catch (e) {
      // If accessing _nativeModule throws, native module definitely isn't linked
      console.log('⚠️ Cannot access Voice native module:', e.message);
      return false;
    }
    
    return isVoiceAvailable && Voice !== null;
  },
  
  // Check if native module is actually linked
  checkNativeModule: async () => {
    // First check if Voice is null - this is the most common issue
    if (Voice === null || Voice === undefined) {
      console.warn('⚠️ VoiceHelper not available - Voice is null (native module not linked)');
      return false;
    }
    
    if (!this.isAvailable()) {
      console.warn('⚠️ VoiceHelper not available for native module check');
      return false;
    }
    
    try {
      // Double-check Voice is still not null before accessing properties
      if (Voice === null || Voice === undefined) {
        return false;
      }
      
      // Try to check if native module is available
      // Use optional chaining to safely check if isAvailable exists
      if (Voice && typeof Voice.isAvailable === 'function') {
        try {
          const available = await Voice.isAvailable();
          console.log('✅ Native module availability check:', available);
          return available;
        } catch (isAvailError) {
          // If isAvailable throws an error about null or undefined, the native module isn't linked
          const errorMsg = isAvailError?.message || String(isAvailError);
          if (errorMsg.includes('null') || errorMsg.includes('undefined') || errorMsg.includes('Cannot read property')) {
            console.warn('⚠️ Native module is not properly linked (isAvailable check failed)');
            return false;
          }
          // Re-throw if it's a different error
          throw isAvailError;
        }
      }
      // If isAvailable doesn't exist, try a simple property check
      // Check if Voice has the native module by trying to access a native property
      try {
        // Use optional chaining to safely access _nativeModule
        if (Voice && Voice._nativeModule !== null && Voice._nativeModule !== undefined) {
          console.log('✅ Native module detected via _nativeModule property');
          return true;
        }
      } catch (propError) {
        // If accessing _nativeModule throws, native module isn't linked
        console.warn('⚠️ Cannot access _nativeModule property:', propError?.message);
        return false;
      }
      // Last resort: assume available if Voice object exists and has start method
      if (typeof Voice.start === 'function') {
        console.log('⚠️ Assuming native module is available (cannot verify)');
        return true;
      }
      return false;
    } catch (error) {
      // Handle any errors gracefully
      const errorMsg = error?.message || String(error);
      // Only log as warning if it's not a null/undefined error (which is expected in Expo Go)
      if (errorMsg.includes('null') || errorMsg.includes('undefined') || errorMsg.includes('Cannot read property')) {
        // This is expected in Expo Go - don't log as error
        console.log('ℹ️ Native module not available (expected in Expo Go - requires development build)');
        return false;
      }
      console.warn('⚠️ Native module check failed:', errorMsg);
      return false;
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
    // Strict null check first
    if (Voice === null || Voice === undefined) {
      console.warn('❌ Voice recognition not available - native module is null');
      console.warn('💡 This requires a development build, not Expo Go.');
      console.warn('💡 Run: npx expo prebuild --clean && npx expo run:android');
      return false;
    }
    
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
      if (Voice === null || Voice === undefined) {
        console.error('❌ Voice is null - native module not linked');
        return false;
      }
      
      if (typeof Voice.start !== 'function') {
        console.error('❌ Voice.start is not a function - native module may not be linked');
        return false;
      }
      
      // Start recognition
      console.log('🚀 Attempting to start Voice recognition with locale:', locale);
      try {
        await Voice.start(locale);
        console.log('✅ Voice recognition started successfully');
        return true;
      } catch (startError) {
        // If error mentions null or startSpeech, native module isn't linked
        if (startError && startError.message && (startError.message.includes('null') || startError.message.includes('startSpeech'))) {
          console.error('❌ Native module not linked - requires development build');
          console.error('💡 Run: npx expo prebuild --clean && npx expo run:android');
          return false;
        }
        // Don't throw - just return false
        console.error('❌ Failed to start voice recognition:', startError.message);
        return false;
      }
    } catch (error) {
      // Check if it's a null error - this is expected when native module isn't linked
      if (error && error.message && error.message.includes('null')) {
        console.warn('⚠️ Native module is null - voice recognition requires a development build');
        console.warn('💡 This is expected if using Expo Go. Run: npx expo prebuild --clean && npx expo run:android');
        return false;
      }
      
      console.error('❌ Voice start error:', error);
      if (error && error.message) {
      console.error('Error message:', error.message);
      }
      return false;
    }
  },

  async stop() {
    // Strict null check first
    if (Voice === null || Voice === undefined) {
      return false;
    }
    
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      // Double-check Voice is still not null
      if (Voice === null || Voice === undefined) {
        return false;
      }
      
      await Voice.stop();
      return true;
    } catch (error) {
      // Check if error is about null
      if (error && error.message && error.message.includes('null')) {
        console.log('ℹ️ Voice stop: native module is null (expected if not using development build)');
        return false;
      }
      console.error('Voice stop error:', error);
      return false;
    }
  },

  async destroy() {
    // Strict null check first
    if (Voice === null || Voice === undefined) {
      return;
    }
    
    if (!this.isAvailable()) {
      return;
    }
    
    try {
      // Double-check Voice is still not null
      if (Voice === null || Voice === undefined) {
        return;
      }
      
      await Voice.cancel?.();
      await Voice.destroy?.();
      Voice.removeAllListeners?.();
    } catch (error) {
      // Check if error is about null - this is expected
      if (error && error.message && error.message.includes('null')) {
        console.log('ℹ️ Voice destroy: native module is null (expected if not using development build)');
        return;
      }
      console.error('Voice destroy error:', error);
    }
  },

  on(event, callback) {
    // Strict null check first
    if (Voice === null || Voice === undefined) {
      console.warn(`⚠️ Cannot add listener for ${event} - Voice is null (native module not linked)`);
      return;
    }
    
    if (!this.isAvailable()) {
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
      
      // Double-check Voice is still not null before setting properties
      if (Voice === null || Voice === undefined) {
        console.warn(`⚠️ Voice became null while setting listener for ${event}`);
        return;
      }
      
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
      // Check if error is about null
      if (error && error.message && error.message.includes('null')) {
        console.warn(`⚠️ Cannot set listener for ${event} - native module is null`);
        return;
      }
      console.error(`❌ Voice on ${event} error:`, error);
    }
  },

  removeAllListeners() {
    // Strict null check first - this is the main issue
    if (Voice === null || Voice === undefined) {
      // Silently return - this is expected when native module isn't linked
      return;
    }
    
    if (!this.isAvailable()) {
      return;
    }
    
    try {
      // Double-check Voice is still not null
      if (Voice === null || Voice === undefined) {
        return;
      }
      
      if (typeof Voice.removeAllListeners === 'function') {
        Voice.removeAllListeners();
      } else {
        // Manually remove listeners - but check Voice is not null before each assignment
        try {
          if (Voice !== null && Voice !== undefined) Voice.onSpeechStart = null;
          if (Voice !== null && Voice !== undefined) Voice.onSpeechEnd = null;
          if (Voice !== null && Voice !== undefined) Voice.onSpeechResults = null;
          if (Voice !== null && Voice !== undefined) Voice.onSpeechError = null;
          if (Voice !== null && Voice !== undefined) Voice.onSpeechRecognized = null;
          if (Voice !== null && Voice !== undefined) Voice.onSpeechPartialResults = null;
        } catch (assignError) {
          // If setting properties fails (e.g., Voice became null), just log and continue
          if (assignError && assignError.message && assignError.message.includes('null')) {
            console.log('ℹ️ Voice became null during listener removal (expected if native module not linked)');
            return;
          }
          throw assignError;
        }
      }
    } catch (error) {
      // Check if error is about null - this is expected when native module isn't linked
      if (error && error.message && error.message.includes('null')) {
        console.log('ℹ️ Voice removeAllListeners: native module is null (expected if not using development build)');
        return;
      }
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

