import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-audio';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import NetInfo from '@react-native-community/netinfo';
const { width, height } = Dimensions.get('window');

// Sound effects
const playSound = async (soundType = 'send') => {
  try {
    // Skip sound on web platform or if audio files are missing
    if (Platform.OS === 'web') {
      console.log(`Sound effect: ${soundType} (web platform - skipped)`);
      return;
    }
    
    const soundObject = new Audio.Sound();
    const soundFile = soundType === 'send' 
      ? require('../../../assets/sounds/send.mp3')
      : require('../../../assets/sounds/receive.mp3');
    
    await soundObject.loadAsync(soundFile);
    await soundObject.playAsync();
    
    // Unload the sound after playing
    soundObject.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        soundObject.unloadAsync();
      }
    });
  } catch (error) {
    console.log(`Sound effect: ${soundType} (audio file not available)`);
  }
};

// Use the API service for making requests
const makeApiCall = async (message, language = 'english') => {
  try {
    console.log('Making API call through apiService');
    
    // Use the apiService sendMessage method which handles offline mode
    const response = await apiService.sendMessage(message, language);
    
    if (response && response.data) {
      console.log('API Response received');
      return { success: true, data: response.data };
    } else {
      console.log('Using offline response');
      return { success: true, data: response };
    }
  } catch (error) {
    console.error('API call failed:', error);
    return { 
      success: false, 
      error: error.message || 'Network request failed',
      retryable: error.code === 'ECONNABORTED' || error.message.includes('timeout')
    };
  }
};

// Test connection function using the API service
const testConnection = async () => {
  try {
    console.log('Testing connection to server...');
    const isHealthy = await apiService.checkHealth();
    console.log('Connection test result:', isHealthy ? 'success' : 'failed');
    return isHealthy;
  } catch (error) {
    console.log('Connection test error:', error.message);
    return false;
  }
};

const GeminiKonsultaBot = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(true);
  
  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('english');
  const [initialized, setInitialized] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const scrollViewRef = useRef();
  const inputRef = useRef();
  
  // Speech recognition state
  const [recording, setRecording] = useState();
  const [transcript, setTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  
  // Request microphone permission
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // For web, check if speech recognition is available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          console.log('Speech recognition not supported in this browser');
        }
      } else {
        // For mobile platforms
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();
  }, []);

  // Check authentication and initialize bot
  useEffect(() => {
    const initialize = async () => {
      // For web demo, skip authentication check
      if (Platform.OS === 'web') {
        console.log('Web demo mode - skipping authentication');
      } else if (!user) {
        navigation.navigate('Login');
        return;
      }

      try {
        setLoading(true);
        const isConnected = await checkConnection();
        setIsOnline(isConnected);
        
        if (isConnected || Platform.OS === 'web') {
          // Add welcome message
          const welcomeMessage = {
            id: 'welcome',
            text: Platform.OS === 'web' 
              ? 'Hello! I\'m KonsultaBot, your advanced AI assistant with intelligent fallback systems. I\'m ready to help with computer problems, software issues, network troubleshooting, gaming questions, and more. How can I assist you today?'
              : 'Hello! I\'m KonsultaBot. How can I help you today?',
            isBot: true,
            timestamp: new Date(),
            mode: Platform.OS === 'web' ? 'gemini-enabled' : 'online'
          };
          setMessages([welcomeMessage]);
        } else {
          const offlineMessage = {
            id: 'offline',
            text: 'I\'m currently offline. You can still ask questions, but my responses will be limited.',
            isBot: true,
            timestamp: new Date(),
            mode: 'offline'
          };
          setMessages([offlineMessage]);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize the chat. Please try again.');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initialize();
  }, [user, navigation]);

  // Check server connection
  const checkConnection = async () => {
    try {
      const isHealthy = await testConnection();
      setIsOnline(isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsOnline(false);
      return false;
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    const message = inputText.trim();
    if (!message || loading) return;

    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Play send sound
    await playSound('send');

    const userMessage = {
      id: `msg-${Date.now()}`,
      text: message,
      isBot: false,
      timestamp: new Date(),
      status: 'sent'
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setTypingIndicator(true);

    try {
      let response;
      
      if (isOnline) {
        // Show typing indicator
        const typingId = `typing-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: typingId,
          isTyping: true,
          timestamp: new Date()
        }]);

        response = await makeApiCall(message, language);
        
        // Remove typing indicator
        setMessages(prev => prev.filter(msg => msg.id !== typingId));

        if (response.success) {
          const botResponse = {
            id: `resp-${Date.now()}`,
            text: response.data.response || 'I received your message but have no response.',
            isBot: true,
            timestamp: new Date(),
            mode: 'online',
            status: 'delivered'
          };
          
          setMessages(prev => [...prev, botResponse]);
          
          // Read response aloud if enabled (skip on web)
          if (isSpeaking && Platform.OS !== 'web') {
            Speech.speak(botResponse.text, {
              language: language === 'filipino' ? 'fil-PH' : 'en-US',
              onDone: () => console.log('Finished speaking'),
              onError: (e) => console.log('Speech not available on web platform')
            });
          }
          
          // Play receive sound
          await playSound('receive');
          
        } else {
          throw new Error(response.error || 'Failed to get response');
        }
      } else {
        // Offline response
        const botResponse = {
          id: `offline-${Date.now()}`,
          text: 'I\'m currently offline. Please check your internet connection and try again later.',
          isBot: true,
          timestamp: new Date(),
          mode: 'offline',
          status: 'delivered'
        };
        setMessages(prev => [...prev, botResponse]);
        await playSound('receive');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: `err-${Date.now()}`,
        text: error.retryable 
          ? 'Connection issue. Trying to reconnect...' 
          : 'Sorry, I encountered an error. Please try again later.',
        isBot: true,
        timestamp: new Date(),
        mode: 'error',
        status: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Auto-retry for network errors
      if (error.retryable) {
        setTimeout(checkConnection, 3000);
      }
    } finally {
      setLoading(false);
      setTypingIndicator(false);
    }
  };

  // Start/stop speech recognition
  const toggleRecording = async () => {
    if (Platform.OS === 'web') {
      await toggleWebSpeechRecognition();
    } else {
      if (recording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    }
  };

  // Web Speech Recognition
  const toggleWebSpeechRecognition = async () => {
    if (isListening) {
      // Stop listening
      if (window.speechRecognition) {
        window.speechRecognition.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'Speech recognition failed. ';
        let showAlert = true;
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = '🎤 **Microphone Access Required**\n\nTo use voice input:\n\n1. Look for the microphone icon 🎤 in your browser\'s address bar\n2. Click it and select "Allow"\n3. Or go to browser Settings > Privacy > Microphone\n4. Refresh the page and try again\n\n💡 **Tip:** You can also type your message instead!';
            break;
          case 'no-speech':
            errorMessage = '🔇 No speech detected. Please speak clearly and try again.';
            break;
          case 'network':
            errorMessage = '🌐 Network error occurred. Please check your connection.';
            break;
          case 'aborted':
            // Don't show alert for user-initiated stops
            showAlert = false;
            break;
          default:
            errorMessage = '❌ Speech recognition failed. Please try typing your message instead.';
        }
        
        if (showAlert) {
          Alert.alert('Voice Input', errorMessage);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        window.speechRecognition = null;
      };

      window.speechRecognition = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Speech recognition not supported:', error);
      setIsListening(false);
      Alert.alert(
        'Speech Recognition Not Available', 
        'Your browser does not support speech recognition. Please type your message instead.'
      );
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsListening(true);
      console.log('Recording started');
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    console.log('Stopping recording...');
    setRecording(undefined);
    setIsListening(false);
    
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      // Here you would typically send the recording to a speech-to-text service
      // For now, we'll just simulate it
      setTimeout(() => {
        setInputText(prev => prev + (prev ? ' ' : '') + 'Sample voice input');
      }, 500);
      
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {
          // Silently handle cleanup errors
        });
      }
      if (Platform.OS !== 'web') {
        Speech.stop().catch(() => {
          // Silently handle speech cleanup errors
        });
      }
    };
  }, [recording]);

  // Render message item
  const renderMessage = ({ item }) => {
    if (item.isTyping) {
      return (
        <View style={[styles.messageContainer, styles.botMessageContainer]}>
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      );
    }

    return (
      <View 
        style={[
          styles.messageContainer,
          item.isBot ? styles.botMessageContainer : styles.userMessageContainer
        ]}
      >
        {item.isBot && (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          item.isBot ? styles.botMessageBubble : styles.userMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            item.isBot ? styles.botMessageText : styles.userMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.isBot && (
          <View style={styles.messageStatus}>
            {item.status === 'sent' && (
              <MaterialIcons name="done" size={16} color="#666" />
            )}
            {item.status === 'delivered' && (
              <MaterialIcons name="done-all" size={16} color="#666" />
            )}
            {item.status === 'error' && (
              <MaterialIcons name="error-outline" size={16} color="#f44336" />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>KonsultaBot</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4caf50' : '#f44336' }]} />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                // Show options menu
                Alert.alert(
                  'Options',
                  '',
                  [
                    {
                      text: 'Clear Chat',
                      onPress: () => setMessages([]),
                      style: 'destructive',
                    },
                    {
                      text: isSpeaking ? 'Mute Voice' : 'Enable Voice',
                      onPress: () => setIsSpeaking(!isSpeaking),
                    },
                    {
                      text: 'Change Language',
                      onPress: () => {
                        Alert.alert(
                          'Select Language',
                          '',
                          [
                            {
                              text: 'English',
                              onPress: () => setLanguage('english'),
                            },
                            {
                              text: 'Filipino',
                              onPress: () => setLanguage('filipino'),
                            },
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                          ],
                          { cancelable: true }
                        );
                      },
                    },
                    {
                      text: 'Logout',
                      onPress: logout,
                      style: 'destructive',
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ],
                  { cancelable: true }
                );
              }}
            >
              <MaterialIcons name="more-vert" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              scrollViewRef.current.scrollToEnd({ animated: true });
            }}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyStatePlaceholder}>
                  <Text style={styles.emptyStateEmoji}>💬</Text>
                </View>
                <Text style={styles.emptyStateText}>
                  {isOnline 
                    ? 'Ask me anything about IT support!' 
                    : 'Offline mode. Some features may be limited.'}
                </Text>
              </View>
            ) : (
              messages.map((message, index) => (
                <View key={`${message.id}-${index}`}>
                  {renderMessage({ item: message })}
                </View>
              ))
            )}
            
            {typingIndicator && (
              <View style={[styles.messageContainer, styles.botMessageContainer]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={toggleRecording}
              disabled={!hasPermission}
            >
              <MaterialIcons 
                name={isListening ? 'mic-off' : 'mic'} 
                size={24} 
                color={isListening ? '#f44336' : (hasPermission ? '#333' : '#999')} 
              />
            </TouchableOpacity>
            
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isListening ? 'Listening...' : 'Type your message...'}
              placeholderTextColor="#999"
              multiline
              editable={!loading && !isListening}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!inputText.trim() || loading) && styles.sendButtonDisabled
              ]} 
              onPress={handleSendMessage}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isOnline 
                ? 'KonsultaBot is online and ready to help!'
                : 'Offline mode. Some features may be limited.'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

// Error boundary for the chat component
class ChatErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chat Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Chat encountered an error</Text>
          <Button
            title="Reload Chat"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

// Create the main component with error boundary
const GeminiKonsultaBotWithErrorBoundary = (props) => {
  return (
    <ChatErrorBoundary>
      <GeminiKonsultaBot {...props} />
    </ChatErrorBoundary>
  );
};

export default GeminiKonsultaBotWithErrorBoundary;

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginLeft: 10,
    padding: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  typingText: {
    marginLeft: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  botMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    marginLeft: 8,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: '#000',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  messageStatus: {
    justifyContent: 'flex-end',
    marginLeft: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1f5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarText: {
    fontSize: 20,
  },
  emptyStateImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyStatePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1f5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateEmoji: {
    fontSize: 50,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginBottom: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'center',
  },
  voiceButton: {
    padding: 8,
    marginRight: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    opacity: 1,
  },
  sendButtonDisabled: {
    backgroundColor: '#a0c4ff',
    opacity: 0.7
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  sendButtonText: {
    fontWeight: 'bold',
    color: '#fff'
  }
});
