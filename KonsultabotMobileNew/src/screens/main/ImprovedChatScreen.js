import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Text,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiService, callGeminiAPI } from '../../services/apiService';
import { intelligentChatService } from '../../services/intelligentChatService';
import { lumaTheme } from '../../theme/lumaTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useChatHistory } from '../../context/ChatHistoryContext';
import HolographicOrb from '../../components/HolographicOrb';
import StarryBackground from '../../components/StarryBackground';
import SpeechWaves from '../../components/SpeechWaves';
import { useNetworkStatus } from '../../utils/networkUtils';
import { searchKnowledgeBase, getRandomTip } from '../../utils/offlineKnowledgeBase';

const { width, height } = Dimensions.get('window');

export default function ImprovedChatScreen({ navigation }) {
  const { logout } = useAuth();
  const { 
    currentChatId, 
    getCurrentChat, 
    createNewChat, 
    updateChatMessages,
    chats,
    setCurrentChatId,
    getChatById 
  } = useChatHistory();
  
  // Network status detection
  const { isOnline, isBackendOnline, checkConnectivity } = useNetworkStatus();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const [wakeWordRecognition, setWakeWordRecognition] = useState(null);
  const scrollViewRef = useRef();
  const carouselRef = useRef();

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
    initializeSpeechRecognition();
    initializeWakeWordDetection();
  }, []);

  // Cleanup wake word listener on unmount
  useEffect(() => {
    return () => {
      if (wakeWordRecognition) {
        try {
          wakeWordRecognition.stop();
        } catch (e) {}
      }
    };
  }, [wakeWordRecognition]);

  // Initialize Speech Recognition (Web Speech API)
  const initializeSpeechRecognition = () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          console.log('🎤 Speech recognized:', transcript);
          setInputText(transcript);
          setIsTranscribing(false);
          setIsRecording(false);
          // Mark as voice input and auto-send
          setIsVoiceInput(true);
          setTimeout(() => {
            sendMessage(transcript, true);
          }, 100);
        };
        
        recognition.onerror = (event) => {
          console.error('❌ Speech recognition error:', event.error);
          setIsTranscribing(false);
          setIsRecording(false);
          Alert.alert(
            'Speech Recognition Error',
            `Could not recognize speech: ${event.error}`,
            [{ text: 'OK' }]
          );
        };
        
        recognition.onend = () => {
          console.log('🎤 Speech recognition ended');
          setIsTranscribing(false);
          setIsRecording(false);
        };
        
        setSpeechRecognition(recognition);
        console.log('✅ Web Speech Recognition initialized');
      } else {
        console.log('⚠️ Speech Recognition not supported in this browser');
      }
    }
  };

  // Initialize Wake Word Detection
  const initializeWakeWordDetection = () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const wakeRecognition = new SpeechRecognition();
        wakeRecognition.continuous = true;
        wakeRecognition.interimResults = true;
        wakeRecognition.lang = 'en-US';
        
        wakeRecognition.onresult = (event) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript.toLowerCase().trim();
          
          console.log('👂 Wake word listener heard:', transcript);
          
          // Check for wake word "help"
          if (transcript.includes('help')) {
            console.log('🔊 WAKE WORD DETECTED: "help"!');
            // Stop wake word listening
            stopWakeWordListening();
            // Start recording
            setTimeout(() => {
              startRecording();
            }, 300);
          }
        };
        
        wakeRecognition.onerror = (event) => {
          console.error('❌ Wake word recognition error:', event.error);
          if (event.error === 'no-speech') {
            // Restart if no speech detected
            if (wakeWordListening) {
              setTimeout(() => {
                try {
                  wakeRecognition.start();
                } catch (e) {}
              }, 100);
            }
          }
        };
        
        wakeRecognition.onend = () => {
          // Restart if still supposed to be listening
          if (wakeWordListening) {
            console.log('🔄 Restarting wake word listener...');
            setTimeout(() => {
              try {
                wakeRecognition.start();
              } catch (e) {}
            }, 100);
          }
        };
        
        setWakeWordRecognition(wakeRecognition);
        console.log('✅ Wake Word Detection initialized (Say "Help" to activate)');
      }
    }
  };

  // Toggle Wake Word Listening
  const toggleWakeWordListening = () => {
    if (!wakeWordRecognition) {
      Alert.alert(
        'Wake Word Not Available',
        'Wake word detection is only available in Chrome, Edge, or Safari browsers.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (wakeWordListening) {
      stopWakeWordListening();
    } else {
      startWakeWordListening();
    }
  };

  const startWakeWordListening = () => {
    try {
      wakeWordRecognition.start();
      setWakeWordListening(true);
      console.log('👂 Wake word listening started - say "Help" to activate mic');
    } catch (error) {
      console.error('Failed to start wake word listening:', error);
    }
  };

  const stopWakeWordListening = () => {
    try {
      wakeWordRecognition.stop();
      setWakeWordListening(false);
      console.log('🔇 Wake word listening stopped');
    } catch (error) {
      console.error('Failed to stop wake word listening:', error);
    }
  };

  const initializeChat = () => {
    // Create initial welcome message
    const welcomeMsg = {
      id: Date.now(),
      text: `Hello! I'm KonsultaBot, your AI assistant! 🤖✨\n\n🌐 Online Mode:\n• Advanced AI-powered responses\n• Real-time information\n• Comprehensive knowledge base\n\n📴 Offline Mode:\n• Basic IT troubleshooting\n• Study tips and academic advice\n• EVSU campus information\n• Common questions answered locally\n\nI automatically detect your connection and adapt! What would you like to know?`,
      sender: 'bot',
      timestamp: new Date(),
    };
    
    // Try to load current chat or use welcome message
    try {
      const currentChat = getCurrentChat?.();
      if (currentChat && currentChat.messages && currentChat.messages.length > 0) {
        setMessages(currentChat.messages);
      } else {
        setMessages([welcomeMsg]);
        // Create a new chat if needed
        if (!currentChatId && createNewChat) {
          createNewChat();
        }
      }
    } catch (error) {
      console.log('Error loading chat, using welcome message:', error);
      setMessages([welcomeMsg]);
    }
  };

  // Save messages whenever they change
  useEffect(() => {
    if (currentChatId && messages.length > 0 && updateChatMessages) {
      try {
        updateChatMessages(currentChatId, messages);
      } catch (error) {
        console.log('Error saving messages:', error);
      }
    }
  }, [messages, currentChatId]);

  const handleNewChat = () => {
    try {
      if (createNewChat) {
        const newChatId = createNewChat();
        setMessages([]);
        setShowHistory(false);
      }
    } catch (error) {
      console.log('Error creating new chat:', error);
    }
  };

  const handleSelectChat = (chatId) => {
    try {
      if (setCurrentChatId) {
        setCurrentChatId(chatId);
        // Load the selected chat's messages
        const selectedChat = getChatById?.(chatId);
        if (selectedChat && selectedChat.messages) {
          setMessages(selectedChat.messages);
        }
      }
      setShowHistory(false);
    } catch (error) {
      console.log('Error selecting chat:', error);
      setShowHistory(false);
    }
  };

  const sendMessage = async (text = inputText, fromVoice = false) => {
    if (!text.trim() || isLoading) return;
    
    // Stop any ongoing speech before sending new message
    try {
      await Speech.stop();
      console.log('🔇 Stopped ongoing speech for new message');
    } catch (error) {
      console.log('No speech to stop');
    }

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Step 1: Force re-check connectivity before sending
      console.log('🔍 Re-checking connectivity before sending...');
      await checkConnectivity();
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Internet:', isOnline ? '✅ Online' : '❌ Offline');
      console.log('Backend:', isBackendOnline ? '✅ Connected' : '❌ Disconnected');

      let botMessage;

      // Step 2: Use Intelligent Chat Service (asks follow-up questions, uses local KB first, Gemini as fallback)
      console.log('🧠 Using Intelligent Chat Service...');
      try {
        const response = await intelligentChatService.chat(text.trim(), 'english');
        
        // Handle follow-up questions
        if (response.needsFollowUp) {
          // Store the context key for the next message
          intelligentChatService.handleFollowUpAnswer(text.trim(), response.contextKey);
          
          botMessage = {
            id: Date.now() + 1,
            text: response.text,
            sender: 'bot',
            timestamp: new Date(),
            confidence: 0.9,
            source: response.source || 'intelligent_chat',
            mode: response.mode || 'offline',
            isQuestion: true,
            contextKey: response.contextKey
          };
        } else {
          // Regular response
          botMessage = {
            id: Date.now() + 1,
            text: response.text,
            sender: 'bot',
            timestamp: new Date(),
            confidence: 0.9,
            source: response.source || 'intelligent_chat',
            mode: response.mode || 'offline'
          };
        }
        
        console.log(`✅ Intelligent Chat response (${response.source}, ${response.mode})`);
      } catch (intelligentError) {
        console.log('❌ Intelligent Chat failed:', intelligentError.message);
        
        // Fallback to knowledge base
        const kbResponse = searchKnowledgeBase(text.trim());
        botMessage = {
          id: Date.now() + 1,
          text: kbResponse.answer + (isOnline ? '\n\n📶 **Online Mode** - Using local knowledge base.' : '\n\n📴 **Offline Mode** - Using local knowledge base.'),
          sender: 'bot',
          timestamp: new Date(),
          confidence: kbResponse.confidence,
          source: 'knowledge_base',
          mode: isOnline ? 'online' : 'offline'
        };
      }

      setMessages(prev => [...prev, botMessage]);
      
      // Speak the bot's response with text-to-speech ONLY if from voice input
      if (fromVoice && botMessage && botMessage.text) {
        try {
          // Stop any ongoing speech first
          await Speech.stop();
          
          // Speak the response
          Speech.speak(botMessage.text, {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.9,
            onDone: () => {
              console.log('✅ TTS finished');
              setIsVoiceInput(false);
            },
            onError: (error) => {
              console.error('❌ TTS error:', error);
              setIsVoiceInput(false);
            },
          });
          console.log('🔊 Speaking AI response (voice input detected)...');
        } catch (ttsError) {
          console.error('❌ Text-to-speech error:', ttsError);
          setIsVoiceInput(false);
          // Continue without TTS if it fails
        }
      } else {
        // Reset voice input flag for text messages
        setIsVoiceInput(false);
      }
      
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      // Final fallback
      const errorMessage = {
        id: Date.now() + 1,
        text: "I encountered an error processing your message. Please try again.\n\nIf you're offline, I'll use my local knowledge base to help you with common questions about IT support, academics, and EVSU information.",
        sender: 'bot',
        timestamp: new Date(),
        source: 'error_fallback'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (item) => (
    <View
      key={item.id}
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {/* Bot Avatar/Icon */}
      {item.sender === 'bot' && (
        <View style={styles.botAvatar}>
          <MaterialIcons name="smart-toy" size={24} color="#9333EA" />
        </View>
      )}
      
      <View
        style={[
          styles.messageBubble,
          item.sender === 'user' ? styles.userMessage : styles.botMessage,
        ]}
      >
        {/* Message Header for Bot */}
        {item.sender === 'bot' && (
          <View style={styles.messageHeader}>
            <Text style={styles.botName}>KonsultaBot</Text>
            {item.source && (
              <View style={styles.sourcebadge}>
                <MaterialIcons 
                  name={
                    item.source === 'online_api' || item.source === 'gemini' ? 'cloud-done' :
                    item.source.includes('knowledge_base') ? 'menu-book' :
                    item.source === 'offline_fallback' ? 'cloud-off' :
                    'info'
                  }
                  size={12}
                  color="#9333EA"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.sourceTextEnhanced}>
                  {item.source === 'online_api' || item.source === 'gemini' ? 'AI' :
                   item.source.includes('knowledge_base') ? 'KB' :
                   item.source === 'offline_fallback' ? 'Offline' : 'Local'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <Text style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
          {item.text}
        </Text>
        
        {/* Timestamp */}
        <Text style={styles.timestampText}>
          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }) : ''}
        </Text>
      </View>
      
      {/* User Avatar/Icon */}
      {item.sender === 'user' && (
        <View style={styles.userAvatar}>
          <MaterialIcons name="person" size={24} color="white" />
        </View>
      )}
    </View>
  );

  // Voice Recording Functions - with Speech-to-Text support
  const startRecording = async () => {
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
          setIsRecording(true);
          console.log('✅ Speech recognition started - speak now!');
        } catch (error) {
          console.error('❌ Failed to start speech recognition:', error);
          Alert.alert(
            'Microphone Error',
            'Could not access microphone. Please allow microphone permissions in your browser.',
            [{ text: 'OK' }]
          );
        }
        return;
      }
      
      // Mobile Audio Recording
      console.log('🎤 Requesting microphone permissions...');
      const { granted } = await Audio.requestPermissionsAsync();
      
      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access to use voice recording feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎤 Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        `Could not start recording: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  const cancelRecording = async () => {
    console.log('❌ Canceling recording...');
    
    // Web Speech API
    if (Platform.OS === 'web' && speechRecognition) {
      try {
        speechRecognition.abort();
        setIsRecording(false);
        setIsTranscribing(false);
        console.log('✅ Recording canceled');
      } catch (error) {
        console.error('❌ Error canceling speech recognition:', error);
        setIsRecording(false);
        setIsTranscribing(false);
      }
      return;
    }
    
    // Mobile - stop and discard recording
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        setRecording(null);
        setIsRecording(false);
        console.log('✅ Recording canceled');
      } catch (error) {
        console.error('❌ Error canceling recording:', error);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    console.log('🛑 Stopping recording...');
    
    // Web Speech API
    if (Platform.OS === 'web' && speechRecognition) {
      try {
        speechRecognition.stop();
        setIsTranscribing(true);
        console.log('🎤 Transcribing speech...');
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
        setIsRecording(false);
        setIsTranscribing(false);
      }
      return;
    }
    
    // Mobile Audio Recording
    setIsRecording(false);
    
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      console.log('✅ Recording stopped, URI:', uri);
      setRecording(null);
      
      // For mobile, show helper message
      Alert.alert(
        'Voice Recording Complete! 🎤',
        'For full speech-to-text on mobile, please use the web version or type your question.',
        [{ text: 'Got it!' }]
      );
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      Alert.alert(
        'Error',
        `Failed to stop recording: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  const suggestions = [
    { id: '1', text: "Help with my computer 💻" },
    { id: '2', text: "Study tips please 📚" },
    { id: '3', text: "Tell me a joke 😄" },
    { id: '4', text: "Test voice features 🎤" },
    { id: '5', text: "What's the meaning of life? 🤔" },
    { id: '6', text: "Random question! 🎲" },
    { id: '7', text: "EVSU campus info 🏫" },
  ];

  const renderSuggestion = ({ item }) => {
    const getIcon = (text) => {
      if (text.includes('computer') || text.includes('💻')) return 'computer';
      if (text.includes('Study') || text.includes('📚')) return 'school';
      if (text.includes('joke') || text.includes('😄')) return 'emoji-emotions';
      if (text.includes('voice') || text.includes('🎤')) return 'mic';
      if (text.includes('life') || text.includes('🤔')) return 'psychology';
      if (text.includes('Random') || text.includes('🎲')) return 'casino';
      if (text.includes('EVSU') || text.includes('🏫')) return 'school';
      return 'chat';
    };

    return (
      <TouchableOpacity
        style={styles.suggestionCard}
        onPress={() => sendMessage(item.text.replace(/[💻📚😄🎤🤔🎲🏫]/g, '').trim())}
        disabled={isLoading}
      >
        <MaterialIcons 
          name={getIcon(item.text)} 
          size={20} 
          color={lumaTheme.colors.primary} 
          style={{ marginBottom: 4 }}
        />
        <Text style={styles.suggestionText}>{item.text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Starry Background */}
      <StarryBackground />

      {/* Large Orb in Center - Shows on welcome or when recording */}
      {(messages.length <= 1 || isRecording || isTranscribing) && (
        <View 
          style={[
            styles.centerOrbContainer,
            (isRecording || isTranscribing) && styles.centerOrbContainerActive
          ]} 
          pointerEvents="none"
        >
          <HolographicOrb 
            size={Math.min(width * 0.6, 300)} 
            animate={true} 
          />
          <SpeechWaves isActive={isRecording} />
          {(isRecording || isTranscribing) && (
            <View style={styles.recordingOverlay}>
              <Text style={styles.recordingText}>
                {isRecording ? '🎤 Listening...' : '✨ Transcribing...'}
              </Text>
              {isRecording && (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={cancelRecording}
                >
                  <MaterialIcons name="close" size={20} color="#EF4444" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      <KeyboardAvoidingView 
        style={[
          styles.contentContainer,
          (isRecording || isTranscribing) && styles.contentContainerBlurred
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerOrb}>
            <HolographicOrb size={36} animate={true} />
          </View>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>KonsultaBot</Text>
              <View style={[
                styles.statusBadge,
                { marginLeft: 8 },
                isOnline && isBackendOnline ? styles.statusOnline :
                isOnline ? styles.statusWarning : styles.statusOffline
              ]}>
                <MaterialIcons 
                  name={
                    isOnline && isBackendOnline ? 'check-circle' :
                    isOnline ? 'warning' : 'cloud-off'
                  }
                  size={10}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.statusBadgeText}>
                  {isOnline && isBackendOnline ? 'ONLINE' :
                   isOnline ? 'LIMITED' : 'OFFLINE'}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              {wakeWordListening && Platform.OS === 'web' && '👂 Listening for "Help"... '}
              {!isOnline && 'Working offline with local knowledge'}
              {isOnline && !isBackendOnline && 'Using fallback responses'}
              {isOnline && isBackendOnline && 'Connected to AI backend'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={checkConnectivity}
            disabled={isLoading}
          >
            <MaterialIcons 
              name="refresh" 
              size={22} 
              color={isOnline && isBackendOnline ? '#10B981' : '#F59E0B'} 
            />
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <TouchableOpacity 
              style={[
                styles.headerButton,
                wakeWordListening && styles.headerButtonActive
              ]}
              onPress={toggleWakeWordListening}
            >
              <MaterialIcons 
                name={wakeWordListening ? 'hearing' : 'hearing-disabled'} 
                size={22} 
                color={wakeWordListening ? '#10B981' : lumaTheme.colors.textMuted} 
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowHistory(!showHistory)}
          >
            <MaterialIcons name="history" size={22} color={lumaTheme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleNewChat}
          >
            <MaterialIcons name="add" size={26} color={lumaTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Chat History Modal */}
        <Modal
          visible={showHistory}
          transparent
          animationType="slide"
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Chat History</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <MaterialIcons name="close" size={24} color={lumaTheme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.historyList}>
                {Array.isArray(chats) && chats.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={[
                      styles.historyItem,
                      chat.id === currentChatId && styles.activeHistoryItem
                    ]}
                    onPress={() => handleSelectChat(chat.id)}
                  >
                    <Text style={styles.historyItemTitle}>{chat.title || 'Untitled Chat'}</Text>
                    <Text style={styles.historyItemDate}>
                      {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : 'Today'}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {(!chats || chats.length === 0) && (
                  <Text style={styles.emptyHistory}>No chat history yet</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={lumaTheme.colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Carousel Suggestions */}
        {messages.length <= 1 && (
          <FlatList
            ref={carouselRef}
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.7 + 12}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContainer}
            style={styles.carousel}
          />
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything! 🤖✨"
            placeholderTextColor={lumaTheme.colors.textMuted}
            multiline
            maxLength={500}
          />
          
          {/* Voice Button */}
          <TouchableOpacity
            style={[
              styles.voiceButton, 
              isRecording && styles.voiceButtonActive,
              isTranscribing && styles.voiceButtonTranscribing
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={lumaTheme.colors.primary} />
            ) : (
              <MaterialIcons 
                name={isRecording ? "stop" : "mic"} 
                size={22} 
                color={isRecording ? '#EF4444' : lumaTheme.colors.primary} 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={(!inputText.trim() || isLoading) ? lumaTheme.colors.textMuted : 'white'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lumaTheme.colors.background,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  contentContainerBlurred: {
    opacity: 0.1,
  },
  centerOrbContainer: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -Math.min(width * 0.3, 150),
    zIndex: 0,
    alignItems: 'center',
  },
  centerOrbContainerActive: {
    zIndex: 9999,
  },
  recordingOverlay: {
    marginTop: 20,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(147, 51, 234, 0.5)',
    alignItems: 'center',
  },
  recordingText: {
    color: lumaTheme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  header: {
    width: '100%',
    maxWidth: width > 1024 ? 1200 : 768,
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: width > 768 ? 16 : 12,
    paddingHorizontal: width > 768 ? 24 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(147, 51, 234, 0.3)',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerOrb: {
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: width > 768 ? 22 : 18,
    fontWeight: 'bold',
    color: lumaTheme.colors.text,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusWarning: {
    backgroundColor: '#F59E0B',
  },
  statusOffline: {
    backgroundColor: '#6B7280',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: width > 768 ? 12 : 11,
    color: lumaTheme.colors.textSecondary,
    marginTop: 4,
  },
  headerButton: {
    padding: width > 768 ? 10 : 8,
    marginLeft: width > 768 ? 6 : 4,
    borderRadius: width > 768 ? 10 : 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  headerButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
    maxWidth: width > 1024 ? 1200 : 768,
    alignSelf: 'center',
  },
  messagesContent: {
    paddingHorizontal: width > 768 ? 32 : 16,
    paddingTop: width > 768 ? 24 : 16,
    paddingBottom: width > 768 ? 24 : 16,
  },
  messageContainer: {
    marginVertical: width > 768 ? 12 : 8,
    maxWidth: width > 768 ? '70%' : '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: lumaTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...lumaTheme.shadows.medium,
  },
  messageBubble: {
    padding: width > 768 ? 18 : 14,
    borderRadius: width > 768 ? 24 : 18,
    maxWidth: '100%',
    ...lumaTheme.shadows.medium,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  botName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333EA',
    letterSpacing: 0.5,
  },
  sourcebadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sourceTextEnhanced: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9333EA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userMessage: {
    backgroundColor: lumaTheme.colors.primary,
    shadowColor: lumaTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  botMessage: {
    backgroundColor: 'rgba(30, 30, 40, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.4)',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  botMessageText: {
    color: lumaTheme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  timestampText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 6,
    textAlign: 'right',
  },
  sourceText: {
    fontSize: 10,
    color: lumaTheme.colors.textMuted,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: lumaTheme.colors.textMuted,
  },
  carousel: {
    maxHeight: 100,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(147, 51, 234, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    marginRight: 12,
    width: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    ...lumaTheme.shadows.medium,
  },
  suggestionText: {
    color: lumaTheme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    maxWidth: width > 1024 ? 1200 : 768,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width > 768 ? 32 : 16,
    paddingVertical: width > 768 ? 16 : 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : width > 768 ? 16 : 12,
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(147, 51, 234, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  textInput: {
    flex: 1,
    fontSize: width > 768 ? 16 : 15,
    color: lumaTheme.colors.text,
    backgroundColor: 'rgba(40, 40, 50, 0.95)',
    borderRadius: width > 768 ? 28 : 24,
    paddingHorizontal: width > 768 ? 24 : 18,
    paddingVertical: width > 768 ? 14 : 12,
    maxHeight: width > 768 ? 120 : 100,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'rgba(147, 51, 234, 0.4)',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceButton: {
    width: width > 768 ? 52 : 46,
    height: width > 768 ? 52 : 46,
    borderRadius: width > 768 ? 26 : 23,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 2,
    borderColor: lumaTheme.colors.primary,
    shadowColor: lumaTheme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  voiceButtonTranscribing: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: lumaTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    ...lumaTheme.shadows.medium,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
    ...lumaTheme.shadows.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  historyContainer: {
    backgroundColor: lumaTheme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    paddingBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: lumaTheme.colors.border,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: lumaTheme.colors.text,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: lumaTheme.colors.border,
  },
  activeHistoryItem: {
    backgroundColor: 'rgba(100, 100, 255, 0.1)',
  },
  historyItemTitle: {
    fontSize: 16,
    color: lumaTheme.colors.text,
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 12,
    color: lumaTheme.colors.textMuted,
  },
  emptyHistory: {
    textAlign: 'center',
    padding: 40,
    color: lumaTheme.colors.textMuted,
  },
});
