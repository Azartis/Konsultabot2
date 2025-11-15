/**
 * Advanced Voice-Enabled Chat Screen with Multilingual Support
 * KonsultaBot Mobile - Full AI Assistant Interface
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
  Vibration
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

// Import offline knowledge base handler
import { getOfflineAnswer, initializeKnowledgeBase } from '../utils/offlineKnowledgeBase';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { ChatBubble } from '../components/ChatBubble';
import { LanguageSelector } from '../components/LanguageSelector';
import { ConnectionStatus } from '../components/ConnectionStatus';

const { width, height } = Dimensions.get('window');

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.17:8000/api/v1/chat'  // Development
  : 'https://your-production-domain.com/api/v1/chat';  // Production

const SUPPORTED_LANGUAGES = [
  { code: 'english', name: 'English', flag: '🇺🇸' },
  { code: 'tagalog', name: 'Tagalog', flag: '🇵🇭' },
  { code: 'bisaya', name: 'Bisaya', flag: '🇵🇭' },
  { code: 'waray', name: 'Waray', flag: '🇵🇭' },
  { code: 'spanish', name: 'Español', flag: '🇪🇸' }
];

export default function AdvancedChatScreen({ navigation }) {
  // State Management
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [sessionId, setSessionId] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  
  // Audio recording
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);

  useEffect(() => {
    initializeChat();
    setupNetworkListener();
    initializeKnowledgeBase();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      // Load previous session or create new one
      const savedSessionId = await AsyncStorage.getItem('konsultabot_session_id');
      if (savedSessionId) {
        setSessionId(savedSessionId);
        await loadChatHistory(savedSessionId);
      }
      
      // Load user preferences
      const savedLanguage = await AsyncStorage.getItem('konsultabot_language');
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
      
      const savedVoiceEnabled = await AsyncStorage.getItem('konsultabot_voice_enabled');
      if (savedVoiceEnabled !== null) {
        setVoiceEnabled(JSON.parse(savedVoiceEnabled));
      }
      
      // Add welcome message
      addBotMessage(getWelcomeMessage(selectedLanguage));
      
    } catch (error) {
      console.error('Chat initialization error:', error);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      
      if (state.isConnected) {
        // Sync offline messages when connection returns
        syncOfflineMessages();
      }
    });
    
    return unsubscribe;
  };

  const loadChatHistory = async (sessionId) => {
    try {
      if (!isConnected) return;
      
      const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}/history/`);
      const history = response.data.messages || [];
      
      const formattedMessages = history.map(msg => ({
        id: msg.id,
        text: msg.message,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp),
        intent: msg.intent,
        confidence: msg.confidence,
        source: msg.source
      }));
      
      setMessages(formattedMessages);
      
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const syncOfflineMessages = async () => {
    try {
      const offlineMessages = await AsyncStorage.getItem('konsultabot_offline_messages');
      if (offlineMessages) {
        const messages = JSON.parse(offlineMessages);
        
        for (const message of messages) {
          await sendQueryToAPI(message.text, false);
        }
        
        // Clear offline messages after sync
        await AsyncStorage.removeItem('konsultabot_offline_messages');
      }
    } catch (error) {
      console.error('Offline sync error:', error);
    }
  };

  const addMessage = (text, sender, metadata = {}) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      ...metadata
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    return newMessage;
  };

  const addBotMessage = (text, metadata = {}) => {
    return addMessage(text, 'bot', metadata);
  };

  const addUserMessage = (text) => {
    return addMessage(text, 'user');
  };

  const sendQuery = async (queryText) => {
    if (!queryText.trim()) return;
    
    // Add user message
    addUserMessage(queryText);
    setIsTyping(true);
    setIsProcessing(true);
    
    try {
      if (isConnected) {
        await sendQueryToAPI(queryText);
      } else {
        await handleOfflineQuery(queryText);
      }
    } catch (error) {
      console.error('Query error:', error);
      addBotMessage(getErrorMessage(selectedLanguage));
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const sendQueryToAPI = async (queryText, saveOffline = true) => {
    try {
      const requestData = {
        query: queryText,
        language: selectedLanguage,
        session_id: sessionId,
        voice_response: voiceEnabled
      };
      
      const response = await axios.post(`${API_BASE_URL}/`, requestData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      
      // Update session ID if new
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        await AsyncStorage.setItem('konsultabot_session_id', data.session_id);
      }
      
      // Add bot response
      const botMessage = addBotMessage(data.message, {
        intent: data.intent,
        confidence: data.confidence,
        source: data.source,
        processingTime: data.processing_time,
        translationUsed: data.translation_used
      });
      
      // Play voice response if available and enabled
      if (voiceEnabled && data.voice_response && data.voice_response.audio_data) {
        await playVoiceResponse(data.voice_response);
      } else if (voiceEnabled && data.message) {
        // Fallback to local TTS
        Speech.speak(data.message, {
          language: getLanguageCode(selectedLanguage),
          rate: 0.8,
          pitch: 1.0
        });
      }
      
    } catch (error) {
      console.error('API request failed:', error);
      
      if (saveOffline) {
        // Save for offline sync
        await saveOfflineMessage(queryText);
        // Try offline response
        await handleOfflineQuery(queryText);
      } else {
        throw error;
      }
    }
  };

  const handleOfflineQuery = async (queryText) => {
    try {
      const offlineResponse = await getOfflineAnswer(queryText, selectedLanguage);
      
      if (offlineResponse) {
        addBotMessage(offlineResponse, {
          source: 'offline_knowledge_base',
          confidence: 0.7
        });
        
        if (voiceEnabled) {
          Speech.speak(offlineResponse, {
            language: getLanguageCode(selectedLanguage),
            rate: 0.8
          });
        }
      } else {
        addBotMessage(getOfflineMessage(selectedLanguage), {
          source: 'offline_fallback',
          confidence: 0.3
        });
      }
      
    } catch (error) {
      console.error('Offline query error:', error);
      addBotMessage(getErrorMessage(selectedLanguage));
    }
  };

  const saveOfflineMessage = async (message) => {
    try {
      const existingMessages = await AsyncStorage.getItem('konsultabot_offline_messages');
      const messages = existingMessages ? JSON.parse(existingMessages) : [];
      
      messages.push({
        text: message,
        timestamp: new Date().toISOString(),
        language: selectedLanguage
      });
      
      await AsyncStorage.setItem('konsultabot_offline_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save offline message:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice features.');
        return;
      }
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Haptic feedback
      Vibration.vibrate(50);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start voice recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      setIsRecording(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      
      // Process the recorded audio
      await processVoiceInput(uri);
      
      setRecording(null);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to process voice recording.');
    }
  };

  const processVoiceInput = async (audioUri) => {
    try {
      setIsProcessing(true);
      
      if (isConnected) {
        // Send to API for speech-to-text
        const formData = new FormData();
        formData.append('audio', {
          uri: audioUri,
          type: 'audio/wav',
          name: 'voice_input.wav',
        });
        formData.append('language', selectedLanguage);
        
        const response = await axios.post(
          `${API_BASE_URL}/speech-to-text/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
          }
        );
        
        const transcription = response.data.text;
        if (transcription) {
          await sendQuery(transcription);
        } else {
          Alert.alert('Voice Recognition', 'Could not understand the audio. Please try again.');
        }
        
      } else {
        // Offline voice processing not available
        Alert.alert(
          'Offline Mode',
          'Voice recognition requires internet connection. Please type your message or connect to the internet.'
        );
      }
      
    } catch (error) {
      console.error('Voice processing error:', error);
      Alert.alert('Voice Error', 'Failed to process voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playVoiceResponse = async (voiceData) => {
    try {
      // Decode base64 audio data
      const audioData = voiceData.audio_data;
      const format = voiceData.format || 'mp3';
      
      // Create temporary file and play
      // This would require additional implementation for playing base64 audio
      // For now, fallback to local TTS
      console.log('Voice response received, using local TTS fallback');
      
    } catch (error) {
      console.error('Voice playback error:', error);
    }
  };

  const changeLanguage = async (languageCode) => {
    setSelectedLanguage(languageCode);
    await AsyncStorage.setItem('konsultabot_language', languageCode);
    
    // Add language change message
    const languageName = SUPPORTED_LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;
    addBotMessage(`Language changed to ${languageName}. ${getWelcomeMessage(languageCode)}`);
  };

  const toggleVoice = async () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    await AsyncStorage.setItem('konsultabot_voice_enabled', JSON.stringify(newVoiceEnabled));
    
    const message = newVoiceEnabled 
      ? 'Voice responses enabled 🔊'
      : 'Voice responses disabled 🔇';
    addBotMessage(message);
  };

  const getWelcomeMessage = (language) => {
    const messages = {
      english: "👋 Hi! I'm KonsultaBot, your IT assistant at EVSU Dulag Campus. How can I help you today?",
      tagalog: "👋 Kumusta! Ako si KonsultaBot, ang inyong IT assistant sa EVSU Dulag Campus. Paano ko kayo matutulungan ngayon?",
      bisaya: "👋 Kumusta! Ako si KonsultaBot, inyong IT tabang sa EVSU Dulag Campus. Unsa man ang matabangan ko ninyo karon?",
      waray: "👋 Kumusta! Ako si KonsultaBot, inyong IT bulig ha EVSU Dulag Campus. Ano man an mabuligan ko ha inyo yana?",
      spanish: "👋 ¡Hola! Soy KonsultaBot, tu asistente de IT en EVSU Dulag Campus. ¿Cómo puedo ayudarte hoy?"
    };
    return messages[language] || messages.english;
  };

  const getOfflineMessage = (language) => {
    const messages = {
      english: "📴 You're currently offline. I can still help with basic IT questions using my local knowledge base!",
      tagalog: "📴 Offline kayo ngayon. Pero maaari pa rin kitang tulungan sa mga basic IT questions gamit ang aking local knowledge!",
      bisaya: "📴 Offline mo karon. Pero matabangan pa gihapon tika sa mga basic IT questions gamit ang akong local knowledge!",
      waray: "📴 Offline ka karon. Pero mabuligan pa gihapon tika han mga basic IT questions gamit an akon local knowledge!"
    };
    return messages[language] || messages.english;
  };

  const getErrorMessage = (language) => {
    const messages = {
      english: "⚠️ Sorry, I encountered an error. Please try again or contact IT support.",
      tagalog: "⚠️ Pasensya na, may error na naganap. Subukan ulit o makipag-ugnayan sa IT support.",
      bisaya: "⚠️ Pasaylo, adunay error nga nahitabo. Sulayi pag-usab o makig-storya sa IT support.",
      waray: "⚠️ Pasaylo, may error nga nahitabo. Sulayi liwat o makig-istorya ha IT support."
    };
    return messages[language] || messages.english;
  };

  const getLanguageCode = (language) => {
    const codes = {
      english: 'en-US',
      tagalog: 'tl-PH',
      bisaya: 'ceb-PH',
      waray: 'war-PH',
      spanish: 'es-ES'
    };
    return codes[language] || 'en-US';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4C9EF6', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={28} color="white" />
            <Text style={styles.headerTitle}>KonsultaBot</Text>
          </View>
          
          <View style={styles.headerRight}>
            <ConnectionStatus isConnected={isConnected} />
            <TouchableOpacity
              style={styles.voiceToggle}
              onPress={toggleVoice}
            >
              <Ionicons 
                name={voiceEnabled ? "volume-high" : "volume-mute"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <LanguageSelector
          languages={SUPPORTED_LANGUAGES}
          selectedLanguage={selectedLanguage}
          onLanguageChange={changeLanguage}
        />
      </LinearGradient>

      {/* Chat Messages */}
      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              isUser={message.sender === 'user'}
            />
          ))}
          
          {isTyping && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#4C9EF6" />
              <Text style={styles.typingText}>KonsultaBot is typing...</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Voice Input Button */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isRecording && styles.voiceButtonRecording,
            isProcessing && styles.voiceButtonProcessing
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            {isProcessing ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={32}
                color="white"
              />
            )}
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={styles.voiceHint}>
          {isRecording 
            ? "Tap to stop recording" 
            : isProcessing 
            ? "Processing..." 
            : "Tap to speak"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceToggle: {
    marginLeft: 15,
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginVertical: 5,
  },
  typingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4C9EF6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4C9EF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#ef4444',
  },
  voiceButtonProcessing: {
    backgroundColor: '#f59e0b',
  },
  voiceHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
