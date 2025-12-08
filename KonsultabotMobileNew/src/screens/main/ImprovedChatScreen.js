import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  StatusBar,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { VoiceHelper } from '../../utils/voiceHelper';
import { apiService } from '../../services/apiService';
import { lumaTheme } from '../../theme/lumaTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useChatHistory } from '../../context/ChatHistoryContext';
import { useTheme } from '../../context/ThemeContext';
import SpeechWaves from '../../components/SpeechWaves';
import { useNetworkStatus } from '../../utils/networkUtils';
import HolographicOrb from '../../components/HolographicOrb';
import GlitchText from '../../components/GlitchText';
import { useOfflineChat } from '../../hooks/useOfflineChat';
import { initializeKnowledgeBase, getOfflineAnswer } from '../../../utils/offlineKnowledgeBase';

const { width, height } = Dimensions.get('window');

export default function ImprovedChatScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { 
    currentChatId, 
    getCurrentChat, 
    createNewChat, 
    updateChatMessages,
    chats,
    setCurrentChatId,
    getChatById,
    removeTemporaryChats
  } = useChatHistory();
  
  // Network status detection
  const { isOnline, isBackendOnline, checkConnectivity } = useNetworkStatus();
  
  // Offline chat storage - use currentChatId or create one
  const chatId = currentChatId || `chat_${user?.id || 'guest'}_${Date.now()}`;
  const { 
    saveMessageOffline, 
    loadOfflineMessages,
    syncNow,
    isSyncing 
  } = useOfflineChat(chatId);
  
  // Get safe area insets for proper spacing on mobile devices
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [responseSpeed, setResponseSpeed] = useState('Fast');
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const [wakeWordRecognition, setWakeWordRecognition] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isSatisfied, setIsSatisfied] = useState(true);
  const [warningMessage, setWarningMessage] = useState(null);
  const [lastBotMessage, setLastBotMessage] = useState(null);
  const scrollViewRef = useRef();
  const carouselRef = useRef();
  const prevUserRef = useRef(user);

  // Create theme-aware styles
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const buildFullName = (profile) => {
    if (!profile) return null;
    const parts = [
      profile.first_name,
      profile.middle_name || profile.middle_initial || profile.middleInitial,
      profile.last_name,
    ].filter(part => typeof part === 'string' && part.trim().length > 0);
    if (parts.length) {
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }
    return profile.username || profile.email || null;
  };

  const userFormalName = useMemo(() => {
    return buildFullName(user || userData);
  }, [user, userData]);

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
    initializeSpeechRecognition();
    initializeWakeWordDetection();
    
    // Initialize offline knowledge base
    initializeKnowledgeBase().catch(err => {
      console.error('Failed to initialize offline KB:', err);
    });
    
    // Load offline messages if available
    if (user?.id && chatId) {
      loadOfflineMessages().then(offlineMessages => {
        if (offlineMessages && offlineMessages.length > 0) {
          // Merge with existing messages (avoid duplicates)
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = offlineMessages.filter(m => !existingIds.has(m.id));
            return [...prev, ...newMessages].sort((a, b) => 
              new Date(a.timestamp) - new Date(b.timestamp)
            );
          });
        }
      }).catch(err => {
        console.error('Error loading offline messages:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId, user?.id, chatId]);

  // Detect login: when user changes from null/undefined to a user object
  useEffect(() => {
    const prevUser = prevUserRef.current;
    const currentUser = user;
    
    // User just logged in (was null/undefined, now has a user)
    if (!prevUser && currentUser) {
      console.log('🆕 User logged in, creating new temporary chat...');
      // Remove any temporary chats that don't have user messages
      if (removeTemporaryChats) {
        removeTemporaryChats();
      }
      // Create a new temporary chat only if there's no current chat
      if (createNewChat && !currentChatId) {
        const newChatId = createNewChat(true); // true = temporary
        // Initialize with welcome message
        const welcomeMsg = {
          id: Date.now(),
          text: `Hello! I'm KonsultaBot, your AI assistant! 🤖✨\n\n🌐 Online Mode:\n• Advanced AI-powered responses\n• Real-time information\n• Comprehensive knowledge base\n\n📴 Offline Mode:\n• Basic IT troubleshooting\n• Study tips and academic advice\n• EVSU campus information\n• Common questions answered locally\n\nI automatically detect your connection and adapt! What would you like to know?`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
      }
    }
    
    // Update ref for next comparison
    prevUserRef.current = currentUser;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentChatId]); // Removed function dependencies to prevent infinite loops

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

  // Handle keyboard show/hide to scroll to end
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Small delay to ensure layout is updated
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
    };
  }, []);

  // Initialize Speech Recognition (Web Speech API for web, VoiceHelper/@react-native-voice/voice for mobile)
  const initializeSpeechRecognition = async () => {
    if (Platform.OS === 'web') {
      const WebSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (WebSpeechRecognition) {
        const recognition = new WebSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // Default to English
        
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
    } else {
      // Mobile: VoiceHelper handles permissions automatically
      // No initialization needed here - permissions requested when starting
      console.log('VoiceHelper available for mobile speech recognition');
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
        wakeRecognition.lang = 'en-US'; // Default to English
        
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
        // No existing chat - show welcome message
        // Chat creation will be handled by login detection useEffect if user is logged in
        setMessages([welcomeMsg]);
      }
    } catch (error) {
      console.log('Error loading chat, using welcome message:', error);
      setMessages([welcomeMsg]);
    }
  };

  // Save messages whenever they change
  // Only save if there are user messages (not just bot welcome messages)
  useEffect(() => {
    if (currentChatId && messages.length > 0 && updateChatMessages) {
      // Check if there are any user messages
      const hasUserMessages = messages.some(m => m.sender === 'user');
      
      // Only save if there are user messages
      if (hasUserMessages) {
        try {
          updateChatMessages(currentChatId, messages);
        } catch (error) {
          console.log('Error saving messages:', error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentChatId]); // Removed updateChatMessages to prevent infinite loops

  const handleNewChat = () => {
    try {
      if (createNewChat) {
        // User manually created a new chat, so it's not temporary
        const newChatId = createNewChat(false); // false = permanent
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

      // Step 2: Always use backend chatbot with KB integration
      console.log('🌐 Calling backend /api/v1/chat/ via apiService...');
      const backendResponse = await apiService.sendV1ChatMessage(
        text.trim(), 
        'english', 
        null, // sessionId
        { is_satisfied: isSatisfied } // additionalData
      );
      const data = backendResponse.data || backendResponse; // Axios wraps in .data

      // Update question count and satisfaction from response
      if (data.question_count !== undefined) {
        setQuestionCount(data.question_count);
      }
      if (data.is_satisfied !== undefined) {
        setIsSatisfied(data.is_satisfied);
      }

      // Handle warnings separately (not as chat messages)
      if (data.warning) {
        setWarningMessage(data.warning);
        // Auto-hide warning after 5 seconds
        setTimeout(() => setWarningMessage(null), 5000);
      }

      // Check if deeper search was triggered
      if (data.deeper_search_triggered) {
        setWarningMessage({
          type: 'info',
          message: '🔍 I\'m now digging deeper into my knowledge base to provide you with a more comprehensive solution.',
        });
        setTimeout(() => setWarningMessage(null), 8000);
      }

      const answerText = data.text || data.message || '';
      botMessage = {
        id: Date.now() + 1,
        text: answerText,
        sender: 'bot',
        timestamp: new Date(),
        confidence: data.confidence ?? 0.9,
        source: data.source || 'backend',
        mode: data.mode || data.metadata?.mode || 'normal',
        kb_source: data.source === 'knowledge_base',
        question_count: data.question_count || questionCount + 1,
        userQuery: text.trim(), // Store the user's query for feedback
        satisfied: null, // Track satisfaction state per message
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Save to offline storage (always save, even if from backend)
      if (user?.id) {
        saveMessageOffline(text.trim(), answerText, 'english').catch(err => {
          console.error('Error saving message offline:', err);
        });
      }
      
      // Store last bot message for feedback tracking
      setLastBotMessage({
        ...botMessage,
        userQuery: text.trim(),
      });
      
      // Speak the bot's response with text-to-speech when from voice input
      // Always use English as default language
      if (fromVoice && botMessage && botMessage.text) {
        try {
          // Stop any ongoing speech first
          await Speech.stop();
          
          // Speak the response - Always use English (en-US)
          Speech.speak(botMessage.text, {
            language: 'en-US', // Default to English
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
          console.log('🔊 Speaking AI response in English (voice input detected)...');
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
      console.log('📴 Falling back to offline mode...');
      
      // Fallback to offline knowledge base
      try {
        const offlineAnswer = await getOfflineAnswer(text.trim(), 'english');
        const offlineBotMessage = {
          id: Date.now() + 1,
          text: offlineAnswer,
          sender: 'bot',
          timestamp: new Date(),
          confidence: 0.8,
          source: 'offline',
          mode: 'offline',
          kb_source: true,
          question_count: questionCount + 1,
          userQuery: text.trim(),
          satisfied: null,
        };

        setMessages(prev => [...prev, offlineBotMessage]);
        
        // Save to offline storage
        if (user?.id) {
          saveMessageOffline(text.trim(), offlineAnswer, 'english').catch(err => {
            console.error('Error saving offline message:', err);
          });
        }
        
        // Store last bot message for feedback tracking
        setLastBotMessage({
          ...offlineBotMessage,
          userQuery: text.trim(),
        });
        
        // Show info message (not error) since offline mode is working
        setWarningMessage({
          type: 'info',
          message: "📴 Offline Mode: Using local knowledge base. Your message will sync when online.",
        });
        setTimeout(() => setWarningMessage(null), 5000);
      } catch (offlineError) {
        console.error('❌ Offline mode also failed:', offlineError);
        // Show error as warning (not as chat message)
        setWarningMessage({
          type: 'error',
          message: "I couldn't reach the online assistant and offline mode failed. Please check your connection and try again.",
        });
        // Auto-hide warning after 8 seconds
        setTimeout(() => setWarningMessage(null), 8000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (value) => {
    if (!value) return '';
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSatisfactionFeedback = async (satisfied, messageItem = null) => {
    setIsSatisfied(satisfied);
    
    // Get the message to provide feedback for (use provided item or last bot message)
    const targetMessage = messageItem || lastBotMessage;
    if (!targetMessage) {
      console.log('No message to provide feedback for');
      return;
    }
    
    // Send feedback to backend with the original query
    // This allows backend to save technical solutions to KB
    try {
      const feedbackQuery = targetMessage.userQuery || targetMessage.text || '';
      await apiService.sendV1ChatMessage(
        feedbackQuery, 
        'english', 
        null, 
        { 
          is_satisfied: satisfied,
          feedback_only: true, // Flag to indicate this is just feedback
        }
      );
      console.log(`✅ Feedback sent: ${satisfied ? 'thumbs up' : 'thumbs down'}`);
    } catch (error) {
      console.log('Feedback update failed (non-critical):', error);
    }
  };

  const renderMessage = (item) => {
    const isUser = item.sender === 'user';
    const isKB = item.kb_source === true;
    return (
      <View key={item.id} style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && (
          <View style={styles.geminiIcon}>
            <HolographicOrb size={32} animate={true} />
          </View>
        )}
        <View
          style={[
            styles.messageBlock,
            isUser ? styles.userBlock : styles.botBlock,
            isKB && styles.kbMessageBlock,
          ]}
        >
          {isKB && (
            <View style={styles.kbBadge}>
              <MaterialIcons name="book" size={12} color="#4285F4" />
              <Text style={styles.kbBadgeText}>Knowledge Base</Text>
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              isUser && styles.userMessageText,
            ]}
          >
            {item.text}
          </Text>
          {!isUser && (
            <View style={styles.satisfactionButtons}>
              <TouchableOpacity
                style={[styles.satisfactionButton, item.satisfied === true && styles.satisfactionButtonActive]}
                onPress={() => {
                  item.satisfied = true;
                  handleSatisfactionFeedback(true, item);
                }}
              >
                <MaterialIcons 
                  name="thumb-up" 
                  size={16} 
                  color={item.satisfied === true ? '#34A853' : '#9AA0A6'} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.satisfactionButton, item.satisfied === false && styles.satisfactionButtonActive]}
                onPress={() => {
                  item.satisfied = false;
                  handleSatisfactionFeedback(false, item);
                }}
              >
                <MaterialIcons 
                  name="thumb-down" 
                  size={16} 
                  color={item.satisfied === false ? '#EA4335' : '#9AA0A6'} 
                />
              </TouchableOpacity>
              {/* Text-to-Speech Button */}
              <TouchableOpacity
                style={styles.satisfactionButton}
                onPress={() => {
                  if (item.text) {
                    VoiceHelper.speak(item.text, {
                      language: 'en-US',
                      pitch: 1.0,
                      rate: 0.9,
                    });
                  }
                }}
              >
                <MaterialIcons 
                  name="volume-up" 
                  size={16} 
                  color="#4285F4" 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {isUser && (
          <View style={styles.messageMenu}>
            <MaterialIcons name="more-vert" size={16} color="#9AA0A6" />
          </View>
        )}
      </View>
    );
  };

  // Voice Recording Functions - with Speech-to-Text support
  const startRecording = async () => {
    // Prevent starting if already recording or transcribing
    if (isRecording || isTranscribing) {
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
          setIsRecording(true);
          setIsVoiceInput(true);
          console.log('✅ Speech recognition started - speak now!');
        } catch (error) {
          console.error('❌ Failed to start speech recognition:', error);
          setIsRecording(false);
          setIsVoiceInput(false);
          Alert.alert(
            'Microphone Error',
            'Could not access microphone. Please allow microphone permissions in your browser.',
            [{ text: 'OK' }]
          );
        }
        return;
      }
      
      // Mobile: Use VoiceHelper (which wraps @react-native-voice/voice)
      console.log('Starting mobile speech recognition...');
      
      if (!VoiceHelper.isAvailable()) {
        Alert.alert(
          'Speech Recognition Not Available',
          'Speech recognition requires a native module that is not available in Expo Go.\n\nPlease create a development build:\n\n1. Run: npx expo prebuild --clean\n2. Run: npx expo run:android\n\nOr use EAS Build to create a development build.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check if native module is actually available (if method exists)
      if (typeof VoiceHelper.checkNativeModule === 'function') {
        try {
          const nativeAvailable = await VoiceHelper.checkNativeModule();
          if (nativeAvailable === false) {
            Alert.alert(
              'Native Module Not Linked',
              'The voice recognition native module is not properly linked.\n\nThis requires a development build, not Expo Go.\n\nSteps:\n1. npx expo prebuild --clean\n2. npx expo run:android',
              [{ text: 'OK' }]
            );
            return;
          }
        } catch (checkError) {
          console.warn('Native module check failed:', checkError);
          // Continue anyway - might still work
        }
      }
      
      try {
        // Clean up any existing listeners first
        VoiceHelper.removeAllListeners();
        setVoiceTranscript('');
        
        // Set up event listeners BEFORE starting
        // Set up partial results listener for real-time transcription
        VoiceHelper.on('SpeechPartialResults', (event) => {
          console.log('📝 SpeechPartialResults event:', event);
          if (event && event.value && Array.isArray(event.value) && event.value.length > 0) {
            const partialTranscript = event.value[0];
            if (partialTranscript && typeof partialTranscript === 'string' && partialTranscript.trim()) {
              console.log('✅ Partial speech recognized:', partialTranscript);
              setVoiceTranscript(partialTranscript);
              setInputText(partialTranscript);
            }
          }
        });
        
        // Set up final result listener
        VoiceHelper.on('SpeechResults', (event) => {
          console.log('✅ SpeechResults event:', event);
          // @react-native-voice/voice provides event.value as array of strings
          if (event && event.value && Array.isArray(event.value) && event.value.length > 0) {
            const transcript = event.value[0];
            if (transcript && typeof transcript === 'string' && transcript.trim()) {
              console.log('✅ Final speech recognized:', transcript);
              setVoiceTranscript(transcript);
              setInputText(transcript);
            }
          }
        });
        
        VoiceHelper.on('SpeechError', (error) => {
          console.error('❌ Speech recognition error:', error);
          setIsRecording(false);
          setIsTranscribing(false);
          setIsVoiceInput(false);
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
          setIsRecording(false);
        });
        
        VoiceHelper.on('SpeechStart', () => {
          console.log('🎤 Speech recognition started');
          setIsRecording(true);
        });
        
        // Now start recognition
        console.log('🚀 Starting voice recognition...');
        const started = await VoiceHelper.start('en-US');
        if (started) {
          setIsRecording(true);
          setIsVoiceInput(true);
          console.log('✅ Mobile speech recognition started - speak now!');
        } else {
          throw new Error('Failed to start voice recognition - start() returned false');
        }
      } catch (error) {
        console.error('Failed to start VoiceHelper:', error);
        setIsRecording(false);
        setIsVoiceInput(false);
        Alert.alert(
          'Speech Recognition Error',
          `Could not start speech recognition: ${error.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setIsRecording(false);
      setIsVoiceInput(false);
      setRecording(null);
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
        setIsVoiceInput(false);
        console.log('✅ Recording canceled');
      } catch (error) {
        console.error('❌ Error canceling speech recognition:', error);
        setIsRecording(false);
        setIsTranscribing(false);
        setIsVoiceInput(false);
      }
      return;
    }
    
    // Mobile - stop and discard speech recognition
    try {
      if (VoiceHelper.isAvailable()) {
        await VoiceHelper.stop();
        VoiceHelper.removeAllListeners();
      }
      setIsRecording(false);
      setIsTranscribing(false);
      setIsVoiceInput(false);
      setVoiceTranscript('');
      console.log('Recording canceled');
    } catch (error) {
      console.error('Error canceling speech recognition:', error);
      setIsRecording(false);
      setIsTranscribing(false);
      setIsVoiceInput(false);
    }
  };

  const stopRecording = async () => {
    console.log('🛑 Stopping recording...');
    
    // Web Speech API
    if (Platform.OS === 'web' && speechRecognition) {
      try {
        speechRecognition.stop();
        setIsTranscribing(true);
        setIsRecording(false);
        console.log('🎤 Transcribing speech...');
      } catch (error) {
        console.error('❌ Error stopping speech recognition:', error);
        setIsRecording(false);
        setIsTranscribing(false);
        setIsVoiceInput(false);
      }
      return;
    }
    
    // Mobile: Stop speech recognition and get transcript
    setIsRecording(false);
    setIsTranscribing(true);
    
    try {
      if (!VoiceHelper.isAvailable()) {
        setIsTranscribing(false);
        setIsVoiceInput(false);
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
      let transcript = voiceTranscript || '';
      
      // Clear the transcript state for next recording
      setVoiceTranscript('');
      
      // Remove listeners
      VoiceHelper.removeAllListeners();
      
      // If no transcript, show message to user
      if (!transcript || !transcript.trim()) {
        console.warn('No transcript available');
        setIsTranscribing(false);
        setIsVoiceInput(false);
        Alert.alert(
          'No Speech Detected',
          'I didn\'t hear anything. Please try speaking again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (transcript && transcript.trim()) {
        console.log('Speech recognized:', transcript);
        setInputText(transcript);
        setIsTranscribing(false);
        setIsVoiceInput(true);
        
        // Auto-send the transcribed message
        setTimeout(() => {
          sendMessage(transcript, true);
        }, 100);
      } else {
        console.warn('No speech detected');
        setIsTranscribing(false);
        setIsVoiceInput(false);
        Alert.alert(
          'No Speech Detected',
          'I didn\'t hear anything. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsRecording(false);
      setIsTranscribing(false);
      setIsVoiceInput(false);
      
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
    <View style={[styles.container, Platform.OS === 'web' && { height: '100vh', maxHeight: '100vh' }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={Platform.OS === 'android' ? 'transparent' : (isDark ? theme.colors.surface : '#FFFFFF')}
        translucent={Platform.OS === 'android'}
      />
      <SafeAreaView 
        style={styles.safeArea}
        edges={Platform.OS === 'ios' ? ['top', 'bottom'] : ['bottom']}
      >
      {/* Recording Overlay - Only show when actively recording */}
      {(isRecording || isTranscribing) && (
        <View style={styles.recordingOverlay} pointerEvents="box-none">
          <View style={styles.recordingContainer}>
            <SpeechWaves isActive={isRecording} />
            <Text style={styles.recordingText}>
              {isRecording ? '🎤 Listening...' : '✨ Transcribing...'}
            </Text>
            {isRecording && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelRecording}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={[
        styles.contentContainer,
        (isRecording || isTranscribing) && styles.contentContainerBlurred
      ]}>
        {/* Warning Banner - Shows warnings separately (not as chat messages) */}
        {warningMessage && (
          <View style={[
            styles.warningBanner,
            warningMessage.type === 'error' && styles.warningBannerError,
            warningMessage.type === 'info' && styles.warningBannerInfo,
          ]}>
            <MaterialIcons 
              name={warningMessage.type === 'error' ? 'error' : 'info'} 
              size={20} 
              color={warningMessage.type === 'error' ? '#EA4335' : '#4285F4'} 
            />
            <Text style={styles.warningBannerText}>
              {typeof warningMessage === 'string' ? warningMessage : warningMessage.message}
            </Text>
            <TouchableOpacity
              onPress={() => setWarningMessage(null)}
              style={styles.warningBannerClose}
            >
              <MaterialIcons name="close" size={18} color="#5F6368" />
            </TouchableOpacity>
          </View>
        )}

        {/* Gemini-Style Header */}
        <View style={[
          styles.geminiHeader,
          { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : 12 }
        ]}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowSideMenu(true)}
          >
            <MaterialIcons name="menu" size={24} color="#5F6368" />
          </TouchableOpacity>
          
          <View style={styles.geminiTitleContainer}>
            <GlitchText style={styles.geminiTitle}>Konsultabot</GlitchText>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowProfileMenu(!showProfileMenu)}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {userFormalName ? userFormalName.charAt(0).toLowerCase() : 'a'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <TouchableOpacity 
            style={styles.profileMenuOverlay}
            activeOpacity={1}
            onPress={() => setShowProfileMenu(false)}
          >
            <View style={styles.profileMenu} onStartShouldSetResponder={() => true}>
              <Text style={styles.profileMenuTitle}>Account</Text>
              <Text style={styles.profileMenuName}>{userFormalName || 'User'}</Text>
              <Text style={styles.profileMenuEmail}>{user?.email || userData?.email || 'user@example.com'}</Text>
              
              {/* Separator */}
              <View style={styles.profileMenuSeparator} />
              
              {/* Logout Button */}
              <TouchableOpacity
                style={styles.profileMenuLogout}
                onPress={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
              >
                <MaterialIcons name="logout" size={18} color="#EA4335" />
                <Text style={styles.profileMenuLogoutText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Gemini-Style Side Menu */}
        <Modal
          visible={showSideMenu}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSideMenu(false)}
        >
          <View style={styles.sideMenuOverlay}>
            <View style={styles.sideMenuContainer}>
              {/* Search Bar */}
              <View style={styles.sideMenuSearch}>
                <MaterialIcons name="search" size={20} color="#5F6368" />
                <TextInput
                  style={styles.sideMenuSearchInput}
                  placeholder="Search for chats"
                  placeholderTextColor="#9AA0A6"
                />
              </View>
              
              {/* New Chat */}
              <TouchableOpacity 
                style={styles.sideMenuNewChat}
                onPress={() => {
                  handleNewChat();
                  setShowSideMenu(false);
                }}
              >
                <MaterialIcons name="edit" size={20} color="#5F6368" />
                <Text style={styles.sideMenuNewChatText}>New chat</Text>
                <View style={styles.sideMenuNewChatIcon}>
                  <MaterialIcons name="more-vert" size={16} color="#5F6368" />
                </View>
              </TouchableOpacity>
              
              {/* Chats */}
              <View style={styles.sideMenuSection}>
                <Text style={styles.sideMenuSectionTitle}>Chats</Text>
                <ScrollView style={styles.sideMenuChatsList}>
                  {Array.isArray(chats) && chats.slice(0, 10).map((chat) => (
                    <TouchableOpacity
                      key={chat.id}
                      style={[
                        styles.sideMenuChatItem,
                        chat.id === currentChatId && styles.sideMenuChatItemActive
                      ]}
                      onPress={() => {
                        handleSelectChat(chat.id);
                        setShowSideMenu(false);
                      }}
                    >
                      <Text style={styles.sideMenuChatTitle} numberOfLines={1}>
                        {chat.title || 'Untitled Chat'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {(!chats || chats.length === 0) && (
                    <Text style={styles.sideMenuEmptyChats}>No chats yet</Text>
                  )}
                </ScrollView>
              </View>
              
              {/* Settings & Help */}
              <TouchableOpacity 
                style={styles.sideMenuSettings}
                onPress={() => {
                  setShowSideMenu(false);
                  navigation.navigate('Settings');
                }}
              >
                <MaterialIcons name="settings" size={20} color="#5F6368" />
                <Text style={styles.sideMenuSettingsText}>Settings & help</Text>
              </TouchableOpacity>
            </View>
            
            {/* Overlay to close menu */}
            <TouchableOpacity 
              style={styles.sideMenuBackdrop}
              onPress={() => setShowSideMenu(false)}
              activeOpacity={1}
            />
          </View>
        </Modal>

        {/* Main Content Area - ScrollView only, no KeyboardAvoidingView */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.mainContent}
          contentContainerStyle={[
            styles.mainContentInner,
            { 
              paddingBottom: Platform.OS === 'web' ? 8 : 120 // Extra padding for fixed input container on mobile
            }
          ]}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          {...(Platform.OS === 'web' && {
            style: [styles.mainContent, { maxHeight: 'calc(100vh - 200px)' }],
          })}
        >
          {/* Greeting Section - Show when no messages or first message */}
          {messages.length === 0 && (
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>
                Hello, {userFormalName ? userFormalName.split(' ')[0].toLowerCase() : 'there'}
              </Text>
            </View>
          )}
          
          {/* Action Chips - Show when no messages */}
          {messages.length === 0 && (
            <View style={styles.actionChipsContainer}>
              <TouchableOpacity 
                style={styles.actionChip}
                onPress={() => sendMessage("Create an image for me")}
              >
                <Text style={styles.actionChipEmoji}>🍌</Text>
                <Text style={styles.actionChipText}>Create Image</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionChip}
                onPress={() => sendMessage("Help me write something")}
              >
                <Text style={styles.actionChipText}>Write</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionChip}
                onPress={() => sendMessage("Help me build or create something")}
              >
                <Text style={styles.actionChipText}>Build</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionChip}
                onPress={() => sendMessage("Do deep research on a topic")}
              >
                <Text style={styles.actionChipText}>Deep Research</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionChip}
                onPress={() => sendMessage("Help me learn something new")}
              >
                <Text style={styles.actionChipText}>Learn</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Messages */}
          {messages.length > 0 && (
            <View style={styles.messagesContainer}>
              {messages.map(renderMessage)}
              
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4285F4" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input Container - Fixed at bottom, outside ScrollView, does NOT move with keyboard */}
        <View style={[
          styles.geminiInputContainer,
          { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : Math.max(insets.bottom, 8) }
        ]}>
          <View style={styles.geminiInputField}>
            <TextInput
              style={styles.geminiTextInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Konsultabot"
              placeholderTextColor="#9AA0A6"
              multiline
              maxLength={500}
              onSubmitEditing={() => {
                if (inputText.trim() && !isLoading) {
                  sendMessage();
                }
              }}
            />
            
            {inputText.trim() ? (
              <TouchableOpacity
                style={styles.geminiSendButton}
                onPress={() => sendMessage()}
                disabled={isLoading}
              >
                <MaterialIcons 
                  name="send" 
                  size={20} 
                  color="#4285F4" 
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.geminiMicButton}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <MaterialIcons 
                    name={isRecording ? "stop" : "mic"} 
                    size={20} 
                    color={isRecording ? '#EA4335' : '#5F6368'} 
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {/* Disclaimer */}
          <Text style={styles.geminiDisclaimer}>
            Konsultabot can make mistakes, so double-check it
          </Text>
        </View>
      </View>
      </SafeAreaView>
    </View>
  );
}

// Create theme-aware styles
const createStyles = (theme, isDark) => {
  const bgColor = isDark ? theme.colors.background : '#F8F9FA';
  const surfaceColor = isDark ? theme.colors.surface : '#FFFFFF';
  const textColor = isDark ? theme.colors.text : '#202124';
  const textSecondary = isDark ? (theme.colors.textSecondary || theme.colors.textMuted || '#A0A0A0') : '#5F6368';
  const borderColor = isDark ? (theme.colors.border || theme.colors.outline || '#2A2A2A') : '#E8EAED';
  const dividerColor = isDark ? (theme.colors.divider || theme.colors.border || '#1E1E1E') : '#E8EAED';
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bgColor,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
    }),
  },
  safeArea: {
    flex: 1,
    backgroundColor: bgColor,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
    ...(Platform.OS === 'web' && {
      display: 'flex',
      height: '100%',
      maxHeight: '100%',
    }),
  },
  contentContainerBlurred: {
    opacity: 0.1,
  },
  // Gemini Header Styles
  geminiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: surfaceColor,
    borderBottomWidth: 0,
  },
  menuButton: {
    padding: 8,
  },
  geminiTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  geminiTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: textColor,
    letterSpacing: 0.5,
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34A853',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  profileMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  profileMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileMenuTitle: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 4,
  },
  profileMenuName: {
    fontSize: 14,
    color: '#202124',
    fontWeight: '500',
    marginBottom: 2,
  },
  profileMenuEmail: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 8,
  },
  profileMenuSeparator: {
    height: 1,
    backgroundColor: '#E8EAED',
    marginVertical: 8,
  },
  profileMenuLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  profileMenuLogoutText: {
    fontSize: 14,
    color: '#EA4335',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Greeting Section
  greetingSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '400',
    color: isDark ? theme.colors.primary : '#1A73E8',
    letterSpacing: 0,
  },
  // Action Chips
  actionChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  actionChipEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  actionChipText: {
    fontSize: 14,
    color: textColor,
    fontWeight: '400',
  },
  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: bgColor,
    ...(Platform.OS === 'web' && {
      overflow: 'auto',
    }),
  },
  recordingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  recordingContainer: {
    backgroundColor: surfaceColor,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  mainContentInner: {
    paddingBottom: 20,
    ...(Platform.OS === 'web' && {
      minHeight: 'auto',
    }),
  },
  recordingText: {
    color: textColor,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
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
  // Side Menu Styles
  sideMenuOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  sideMenuContainer: {
    width: width * 0.85,
    maxWidth: 360,
    backgroundColor: surfaceColor,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sideMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideMenuSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? theme.colors.surfaceVariant || theme.colors.surface : '#F1F3F4',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
  },
  sideMenuSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: textColor,
  },
  sideMenuNewChat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  sideMenuNewChatText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 14,
    color: textColor,
    fontWeight: '400',
  },
  sideMenuNewChatIcon: {
    padding: 4,
  },
  sideMenuSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sideMenuSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sideMenuSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: textColor,
  },
  sideMenuChatsList: {
    maxHeight: 300,
  },
  sideMenuChatItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sideMenuChatItemActive: {
    backgroundColor: isDark ? 'rgba(79, 142, 255, 0.2)' : '#E8F0FE',
  },
  sideMenuChatTitle: {
    fontSize: 14,
    color: textSecondary,
  },
  sideMenuEmptyChats: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: textSecondary,
    fontStyle: 'italic',
  },
  sideMenuSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: dividerColor,
  },
  sideMenuSettingsText: {
    marginLeft: 16,
    fontSize: 14,
    color: textColor,
  },
  sideMenuUpgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? theme.colors.surfaceVariant || theme.colors.surface : '#F1F3F4',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  sideMenuUpgradeIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideMenuUpgradeIconText: {
    fontSize: 18,
  },
  sideMenuUpgradeText: {
    flex: 1,
    fontSize: 14,
    color: textColor,
    fontWeight: '500',
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
    color: textColor,
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
    color: textSecondary,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  geminiIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBlock: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  botBlock: {
    backgroundColor: isDark ? (theme.colors.surfaceVariant || theme.colors.surface) : '#E8F0FE',
    borderTopLeftRadius: 4,
  },
  userBlock: {
    backgroundColor: isDark ? theme.colors.primary : '#F1F3F4',
    borderTopRightRadius: 4,
    opacity: isDark ? 0.3 : 1,
  },
  messageMenu: {
    padding: 8,
    marginLeft: 4,
    marginTop: 4,
  },
  noticeBlock: {
    borderBottomColor: '#C7D2FE',
  },
  tipBlock: {
    borderBottomColor: '#FDE68A',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: textSecondary,
    marginBottom: 6,
  },
  botSenderLabel: {
    color: textSecondary,
  },
  userSenderLabel: {
    color: textSecondary,
    textAlign: 'right',
  },
  messageTimestamp: {
    marginTop: 8,
    fontSize: 11,
    color: textSecondary,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: textColor,
  },
  userMessageText: {
    color: isDark ? theme.colors.text : '#202124',
  },
  confidenceNote: {
    marginTop: 10,
    fontSize: 11,
    color: 'rgba(226, 232, 240, 0.55)',
    fontStyle: 'italic',
    textAlign: 'left',
  },
  userTimestamp: {
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: textSecondary,
  },
  carousel: {
    maxHeight: 100,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionCard: {
    backgroundColor: isDark ? 'rgba(30, 30, 40, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(147, 51, 234, 0.4)' : 'rgba(79, 142, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    marginRight: 12,
    width: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    ...(isDark ? lumaTheme.shadows.medium : {}),
  },
  suggestionText: {
    color: textColor,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Gemini Input Styles
  geminiInputContainer: {
    backgroundColor: surfaceColor,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: dividerColor,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 5, // For Android shadow
    width: '100%',
    ...(Platform.OS === 'web' && {
      position: 'relative',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
    }),
  },
  geminiInputField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: isDark ? (theme.colors.surfaceVariant || theme.colors.surface) : '#F1F3F4',
    marginHorizontal: 16,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 8,
    minHeight: 56,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: borderColor,
    ...(Platform.OS === 'web' && {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }),
  },
  geminiTextInput: {
    flex: 1,
    fontSize: 16,
    color: textColor,
    paddingVertical: 12,
    paddingHorizontal: 8,
    maxHeight: 120,
  },
  geminiMicButton: {
    padding: 10,
    marginRight: 4,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geminiSendButton: {
    padding: 10,
    marginRight: 4,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geminiDisclaimer: {
    fontSize: 11,
    color: textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  // Warning Banner Styles
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FBBC04',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 1px 2px 0 rgba(60,64,67,.3)',
    }),
  },
  warningBannerError: {
    backgroundColor: '#FEE',
    borderLeftColor: '#EA4335',
  },
  warningBannerInfo: {
    backgroundColor: '#E8F0FE',
    borderLeftColor: '#4285F4',
  },
  warningBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#202124',
    marginLeft: 12,
    lineHeight: 20,
  },
  warningBannerClose: {
    padding: 4,
    marginLeft: 8,
  },
  // Knowledge Base Badge
  kbMessageBlock: {
    borderLeftWidth: 3,
    borderLeftColor: '#4285F4',
  },
  kbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  kbBadgeText: {
    fontSize: 11,
    color: '#4285F4',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Satisfaction Feedback Buttons
  satisfactionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  satisfactionButton: {
    padding: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F1F3F4',
  },
  satisfactionButtonActive: {
    backgroundColor: '#E8F0FE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  historyContainer: {
    backgroundColor: surfaceColor,
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
    borderBottomColor: borderColor,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: textColor,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  },
  activeHistoryItem: {
    backgroundColor: isDark ? 'rgba(79, 142, 255, 0.2)' : 'rgba(100, 100, 255, 0.1)',
  },
  historyItemTitle: {
    fontSize: 16,
    color: textColor,
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 12,
    color: textSecondary,
  },
  emptyHistory: {
    textAlign: 'center',
    padding: 40,
    color: textSecondary,
  },
});
};
