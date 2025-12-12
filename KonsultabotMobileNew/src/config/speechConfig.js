/**
 * Speech-to-Text Configuration
 * API Key for speech recognition services
 */
import Constants from 'expo-constants';

// Speech-to-Text API Keys
// Google Speech API Key (legacy)
export const SPEECH_API_KEY = 'Gtt3Q9ZEM8fsg2qfXqi8j5Yk4H4DxbS8';

// LemonFox API Key for Speech-to-Text
// Get your API key from https://www.lemonfox.ai/
// Set it via environment variable: EXPO_PUBLIC_LEMONFOX_API_KEY
// Or update this file directly (not recommended for production)
export const LEMONFOX_API_KEY = 
  process.env.EXPO_PUBLIC_LEMONFOX_API_KEY || 
  Constants.expoConfig?.extra?.lemonfoxApiKey ||
  'YOUR_LEMONFOX_API_KEY_HERE';

// LemonFox API Configuration
export const LEMONFOX_CONFIG = {
  apiUrl: 'https://api.lemonfox.ai/v1/audio/transcriptions',
  timeout: 30000, // 30 seconds
};

// Speech recognition settings
export const SPEECH_CONFIG = {
  // Default language for speech recognition
  defaultLanguage: 'en-US',
  
  // Supported languages
  supportedLanguages: {
    'english': 'en-US',
    'tagalog': 'tl-PH',
    'bisaya': 'ceb-PH',
    'waray': 'war-PH',
    'en': 'en-US',
    'en-US': 'en-US',
  },
  
  // Audio recording settings
  recording: {
    // Audio format for recording
    format: 'm4a', // m4a works well on both iOS and Android
    
    // Quality settings
    quality: 'high', // 'low', 'medium', 'high'
    
    // Maximum recording duration (in seconds)
    maxDuration: 60,
  },
  
  // Transcription settings
  transcription: {
    // Timeout for transcription requests (in milliseconds)
    timeout: 30000, // 30 seconds
    
    // Retry attempts if transcription fails
    maxRetries: 2,
  },
};

export default SPEECH_CONFIG;

