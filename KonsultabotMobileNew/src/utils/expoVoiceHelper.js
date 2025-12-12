/**
 * Expo Voice Helper - Works in Expo Go and Production
 * Uses expo-av for audio recording and sends to backend for speech-to-text
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const ExpoVoiceHelper = {
  recording: null,
  isRecording: false,
  recordingUri: null,

  async requestPermissions() {
    try {
      if (Platform.OS === 'web') {
        // Web: Request microphone permission via getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
          return true;
        } catch (error) {
          console.error('Microphone permission denied:', error);
          return false;
        }
      } else {
        // Mobile: Request audio recording permission
        const { status } = await Audio.requestPermissionsAsync();
        if (status === 'granted') {
          console.log('✅ Audio recording permission granted');
          return true;
        } else {
          console.warn('⚠️ Audio recording permission denied');
          return false;
        }
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  },

  async start() {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create a new recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Recording status updates
          if (status.isRecording) {
            this.isRecording = true;
          }
        }
      );

      this.recording = recording;
      this.isRecording = true;
      console.log('✅ Audio recording started');

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      throw error;
    }
  },

  async stop() {
    try {
      if (!this.recording) {
        console.warn('No active recording to stop');
        return null;
      }

      this.isRecording = false;
      await this.recording.stopAndUnloadAsync();
      
      const uri = this.recording.getURI();
      this.recordingUri = uri;
      
      console.log('✅ Recording stopped, saved to:', uri);
      
      // Clean up
      this.recording = null;

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.isRecording = false;
      return null;
    }
  },

  async cancel() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      this.isRecording = false;
      this.recordingUri = null;
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  },

  getRecordingUri() {
    return this.recordingUri;
  },

  async getRecordingDuration() {
    if (!this.recording) {
      return 0;
    }
    try {
      const status = await this.recording.getStatusAsync();
      return status.durationMillis || 0;
    } catch (error) {
      console.error('Failed to get recording duration:', error);
      return 0;
    }
  },

  isAvailable() {
    // expo-av is available in both Expo Go and production builds
    return true;
  },

  async cleanup() {
    try {
      if (this.recording) {
        await this.cancel();
      }
      if (this.recordingUri) {
        // Optionally delete the file
        try {
          await FileSystem.deleteAsync(this.recordingUri, { idempotent: true });
        } catch (e) {
          // File might already be deleted
        }
        this.recordingUri = null;
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  },
};

export default ExpoVoiceHelper;

