import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { VoiceHelper } from '../utils/voiceHelper';
import chatService from '../services/chatService';

const ChatScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(true);
  const scrollViewRef = useRef();
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [currentMode, setCurrentMode] = useState('chat'); // 'chat', 'translation', 'image-gen'
  const [speechRecognition, setSpeechRecognition] = useState(null);

  useEffect(() => {
    // Load chat history
    loadHistory();
    // Request audio permissions
    Audio.requestPermissionsAsync();
    
    // Initialize Web Speech API for web platform
    if (Platform.OS === 'web') {
      const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (WebSpeechRecognition) {
        const recognition = new WebSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          console.log('🎤 Speech recognized:', transcript);
          setMessage(transcript);
          setVoiceTranscript(transcript);
          setIsTranscribing(false);
          setRecording(false);
        };
        
        recognition.onerror = (event) => {
          console.error('❌ Speech recognition error:', event.error);
          setIsTranscribing(false);
          setRecording(false);
          Alert.alert(
            'Speech Recognition Error',
            `Could not recognize speech: ${event.error}`,
            [{ text: 'OK' }]
          );
        };
        
        recognition.onend = () => {
          console.log('🎤 Speech recognition ended');
          setIsTranscribing(false);
          setRecording(false);
        };
        
        setSpeechRecognition(recognition);
        console.log('✅ Web Speech Recognition initialized');
      } else {
        console.log('⚠️ Speech Recognition not supported in this browser');
      }
    }
    
    // Initialize voice recognition listeners for mobile
    if (Platform.OS !== 'web' && VoiceHelper.isAvailable()) {
      VoiceHelper.on('SpeechPartialResults', (event) => {
        console.log('📝 SpeechPartialResults event:', event);
        if (event && event.value && Array.isArray(event.value) && event.value.length > 0) {
          const partialTranscript = event.value[0];
          if (partialTranscript && typeof partialTranscript === 'string' && partialTranscript.trim()) {
            console.log('✅ Partial speech recognized:', partialTranscript);
            setVoiceTranscript(partialTranscript);
            setMessage(partialTranscript);
          }
        }
      });
      
      VoiceHelper.on('SpeechResults', (event) => {
        console.log('✅ SpeechResults event:', event);
        if (event && event.value && Array.isArray(event.value) && event.value.length > 0) {
          const transcript = event.value[0];
          if (transcript && typeof transcript === 'string' && transcript.trim()) {
            console.log('✅ Final speech recognized:', transcript);
            setVoiceTranscript(transcript);
            setMessage(transcript);
          }
        }
      });
      
      VoiceHelper.on('SpeechError', (error) => {
        console.error('❌ Speech recognition error:', error);
        setRecording(false);
        setIsTranscribing(false);
        setVoiceTranscript('');
        const errorMsg = error?.error?.message || error?.message || error?.error || 'Unknown error';
        Alert.alert(
          'Speech Recognition Error',
          `Could not recognize speech: ${errorMsg}`,
          [{ text: 'OK' }]
        );
      });
      
      VoiceHelper.on('SpeechEnd', () => {
        console.log('🛑 Speech recognition ended');
        setRecording(false);
      });
      
      VoiceHelper.on('SpeechStart', () => {
        console.log('🎤 Speech recognition started');
        setRecording(true);
      });
    }
    
    return () => {
      // Clean up voice recognition
      if (VoiceHelper.isAvailable()) {
        VoiceHelper.removeAllListeners();
        VoiceHelper.destroy();
      }
    };
  }, []);

  const loadHistory = async () => {
    const history = await chatService.getHistory();
    if (history.length > 0) {
      const formattedMessages = history.map(item => ({
        id: item.id || Date.now(),
        text: item.message,
        response: item.response,
        isUser: true,
        timestamp: new Date(item.timestamp)
      }));
      setMessages(formattedMessages);
    }
  };

  const handleSend = async () => {
    if (message.trim()) {
      const userMessage = {
        id: Date.now(),
        text: message,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentMessage = message;
      setMessage('');
      setLoading(true);

      try {
        const response = await chatService.sendMessage(currentMessage);
        
        if (response.success) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: response.text,
            isUser: false,
            timestamp: new Date(),
            mode: response.mode
          }]);
        } else {
          Alert.alert('Error', 'Failed to get response from the bot');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
      } finally {
        setLoading(false);
      }
    }
  };

  const startRecording = async () => {
    // Prevent starting if already recording or transcribing
    if (recording || isTranscribing) {
      console.warn('⚠️ Already recording or transcribing');
      return;
    }

    try {
      // Web Speech API for web platform
      if (Platform.OS === 'web') {
        if (!speechRecognition) {
          Alert.alert(
            'Speech Recognition Not Available',
            'Your browser does not support speech recognition. Please try Chrome, Edge, or Safari.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        console.log('🎤 Starting speech recognition...');
        try {
          speechRecognition.start();
          setRecording(true);
          setIsTranscribing(false);
          setVoiceTranscript('');
          console.log('✅ Speech recognition started - speak now!');
        } catch (error) {
          console.error('❌ Failed to start speech recognition:', error);
          setRecording(false);
          Alert.alert(
            'Microphone Error',
            'Could not access microphone. Please allow microphone permissions in your browser.',
            [{ text: 'OK' }]
          );
        }
        return;
      }
      
      // Mobile: Check if voice recognition is available
      if (!VoiceHelper.isAvailable()) {
        Alert.alert(
          'Speech Recognition Not Available',
          'Speech recognition requires a native module that is not available in Expo Go.\n\nPlease create a development build:\n\n1. Run: npx expo prebuild --clean\n2. Run: npx expo run:android\n\nOr use EAS Build to create a development build.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Clean up any existing listeners first
      VoiceHelper.removeAllListeners();
      setVoiceTranscript('');
      
      // Set up event listeners BEFORE starting
      VoiceHelper.on('SpeechPartialResults', (event) => {
        console.log('📝 SpeechPartialResults event:', event);
        if (event && event.value && Array.isArray(event.value) && event.value.length > 0) {
          const partialTranscript = event.value[0];
          if (partialTranscript && typeof partialTranscript === 'string' && partialTranscript.trim()) {
            console.log('✅ Partial speech recognized:', partialTranscript);
            setVoiceTranscript(partialTranscript);
            setMessage(partialTranscript);
          }
        }
      });
      
      VoiceHelper.on('SpeechResults', (event) => {
        console.log('✅ SpeechResults event:', event);
        if (event && event.value && Array.isArray(event.value) && event.value.length > 0) {
          const transcript = event.value[0];
          if (transcript && typeof transcript === 'string' && transcript.trim()) {
            console.log('✅ Final speech recognized:', transcript);
            setVoiceTranscript(transcript);
            setMessage(transcript);
          }
        }
      });
      
      VoiceHelper.on('SpeechError', (error) => {
        console.error('❌ Speech recognition error:', error);
        setRecording(false);
        setIsTranscribing(false);
        setVoiceTranscript('');
        const errorMsg = error?.error?.message || error?.message || error?.error || 'Unknown error';
        Alert.alert(
          'Speech Recognition Error',
          `Could not recognize speech: ${errorMsg}`,
          [{ text: 'OK' }]
        );
      });
      
      VoiceHelper.on('SpeechEnd', () => {
        console.log('🛑 Speech recognition ended');
        setRecording(false);
      });
      
      VoiceHelper.on('SpeechStart', () => {
        console.log('🎤 Speech recognition started');
        setRecording(true);
      });
      
      // Now start recognition
      console.log('🚀 Starting voice recognition...');
      const started = await VoiceHelper.start('en-US');
      if (started) {
        setRecording(true);
        console.log('✅ Mobile speech recognition started - speak now!');
      } else {
        throw new Error('Failed to start voice recognition - start() returned false');
      }
    } catch (error) {
      console.error('Failed to start VoiceHelper:', error);
      setRecording(false);
      setIsTranscribing(false);
      Alert.alert(
        'Speech Recognition Error',
        `Could not start speech recognition: ${error.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    console.log('🛑 Stopping recording...');
    
    // Web Speech API
    if (Platform.OS === 'web' && speechRecognition) {
      try {
        speechRecognition.stop();
        setIsTranscribing(true);
        setRecording(false);
        console.log('🎤 Transcribing speech...');
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
        setRecording(false);
        setIsTranscribing(false);
      }
      return;
    }
    
    setRecording(false);
    setIsTranscribing(true);
    
    try {
      if (!VoiceHelper.isAvailable()) {
        setIsTranscribing(false);
        Alert.alert(
          'Speech Recognition Not Available',
          'Speech recognition is not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Stop VoiceHelper
      await VoiceHelper.stop();
      
      // Wait a moment for final processing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get transcript from state (set by listener)
      let transcript = voiceTranscript || message || '';
      
      // Clear the transcript state for next recording
      setVoiceTranscript('');
      
      // Remove listeners
      VoiceHelper.removeAllListeners();
      
      // If no transcript, show message to user
      if (!transcript || !transcript.trim()) {
        console.warn('No transcript available');
        setIsTranscribing(false);
        Alert.alert(
          'No Speech Detected',
          'I didn\'t hear anything. Please try speaking again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (transcript && transcript.trim()) {
        console.log('Speech recognized:', transcript);
        setMessage(transcript);
        setIsTranscribing(false);
        
        // Optionally auto-send the transcribed message
        // Uncomment the line below if you want to auto-send after voice input
        // setTimeout(() => handleSend(), 100);
      } else {
        console.warn('No speech detected');
        setIsTranscribing(false);
        Alert.alert(
          'No Speech Detected',
          'I didn\'t hear anything. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setRecording(false);
      setIsTranscribing(false);
      
      // Clean up listeners
      try {
        VoiceHelper.removeAllListeners();
      } catch (e) {
        // Ignore cleanup errors
      }
      
      // Check if it's a permission error
      if (error.message && error.message.includes('permission')) {
        Alert.alert(
          'Permission Error',
          'Microphone permission is required for voice input. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Speech Recognition Error',
          `Could not transcribe speech: ${error.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const cancelRecording = async () => {
    console.log('❌ Canceling recording...');
    
    // Web Speech API
    if (Platform.OS === 'web' && speechRecognition) {
      try {
        speechRecognition.abort();
        setRecording(false);
        setIsTranscribing(false);
        setVoiceTranscript('');
        setMessage('');
        console.log('✅ Recording canceled');
      } catch (error) {
        console.error('❌ Error canceling speech recognition:', error);
        setRecording(false);
        setIsTranscribing(false);
      }
      return;
    }
    
    // Mobile
    try {
      if (VoiceHelper.isAvailable()) {
        await VoiceHelper.stop();
        VoiceHelper.removeAllListeners();
      }
      setRecording(false);
      setIsTranscribing(false);
      setVoiceTranscript('');
      setMessage('');
      console.log('Recording canceled');
    } catch (error) {
      console.error('Error canceling speech recognition:', error);
      setRecording(false);
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>KonsultaBot</Text>
          <Text style={styles.subtitle}>Your Smart AI Companion</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.isUser ? styles.userMessageWrapper : styles.botMessageWrapper,
            ]}
          >
            {!msg.isUser && (
              <View style={styles.botAvatar}>
                <Icon name="logo-electron" size={24} color="#007AFF" />
              </View>
            )}
            <View
              style={[
                styles.message,
                msg.isUser ? styles.userMessage : styles.botMessage,
              ]}
            >
              <Text style={msg.isUser ? styles.userMessageText : styles.botMessageText}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Quick Access History */}
      <ScrollView horizontal style={styles.quickAccess} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.quickAccessItem}>
          <Icon name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.quickAccessText}>Daily task planner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAccessItem}>
          <Icon name="help-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.quickAccessText}>Recent questions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAccessItem}>
          <Icon name="document-text-outline" size={20} color="#007AFF" />
          <Text style={styles.quickAccessText}>Knowledge base</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Input Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TouchableOpacity style={styles.attachButton}>
          <Icon name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={styles.micButton}
          onPress={toggleRecording}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Icon
              name={recording ? "stop-circle" : "mic"}
              size={24}
              color={recording ? "#FF3B30" : "#007AFF"}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, message.trim() ? styles.sendButtonActive : null]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Icon name="send" size={24} color={message.trim() ? "#fff" : "#A0A0A0"} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  settingsButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  botMessageWrapper: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  message: {
    padding: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#007AFF',
  },
  botMessage: {
    backgroundColor: '#1C1C1E',
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#fff',
  },
  quickAccess: {
    backgroundColor: '#1C1C1E',
    padding: 12,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  quickAccessText: {
    color: '#fff',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    color: '#fff',
    maxHeight: 100,
  },
  micButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    opacity: 0.5,
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
    opacity: 1,
  },
});

export default ChatScreen;