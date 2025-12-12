/**
 * Expo Voice Helper - Fallback voice recognition using expo-av + backend transcription
 */
import { Audio } from 'expo-av';
import { apiService } from '../services/apiService';

let recording = null;
let isRecording = false;

export const ExpoVoiceHelper = {
  /**
   * Check and request microphone permissions (only requests if not already granted)
   */
  async checkAndRequestPermissions() {
    try {
      // First check current permission status
      const { status: currentStatus } = await Audio.getPermissionsAsync();
      
      // If already granted, return true
      if (currentStatus === 'granted') {
        console.log('✅ Microphone permission already granted');
        return true;
      }
      
      // If not granted, request permission
      console.log('📱 Requesting microphone permission...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        console.log('✅ Microphone permission granted');
        return true;
      } else {
        console.warn('⚠️ Microphone permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking/requesting permissions:', error);
      return false;
    }
  },

  async start() {
    try {
      // Check and request permissions (only requests if not already granted)
      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recording = newRecording;
      isRecording = true;
      console.log('✅ Expo recording started');
      return true;
    } catch (error) {
      console.error('❌ Expo recording start error:', error);
      return false;
    }
  },

  async stop() {
    if (!recording || !isRecording) {
      return null;
    }
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      isRecording = false;
      recording = null;
      
      // Return just the URI - let the caller handle transcription
      return uri;
    } catch (error) {
      console.error('❌ Expo recording stop error:', error);
      isRecording = false;
      recording = null;
      return null;
    }
  },

  async cancel() {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error canceling recording:', error);
      }
      recording = null;
      isRecording = false;
    }
  },

  isRecording: () => isRecording,
};

export default ExpoVoiceHelper;

