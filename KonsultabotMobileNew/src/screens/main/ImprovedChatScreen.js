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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiService } from '../../services/apiService';
import { lumaTheme } from '../../theme/lumaTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useChatHistory } from '../../context/ChatHistoryContext';
import HolographicOrb from '../../components/HolographicOrb';
import StarryBackground from '../../components/StarryBackground';
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
  const scrollViewRef = useRef();
  const carouselRef = useRef();

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
  }, []);

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

  const sendMessage = async (text = inputText) => {
    if (!text.trim() || isLoading) return;

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

      // Step 2: If online and backend available, use API
      if (isOnline && isBackendOnline) {
        console.log('🌐 Using online mode - calling backend API...');
        console.log('📡 API Endpoint:', apiService.baseURL || 'http://localhost:8000');
        try {
          const response = await apiService.sendChatMessage(text.trim());
          
          console.log('✅ API Response received:', {
            hasMessage: !!response.message,
            hasResponse: !!response.response,
            fullResponse: response,
            source: response.source,
            confidence: response.confidence
          });
          
          // Check if response has actual content
          const responseText = response.message || response.response || response.text;
          
          if (!responseText) {
            console.warn('⚠️ Backend returned empty response, using fallback');
            throw new Error('Empty response from backend');
          }
          
          botMessage = {
            id: Date.now() + 1,
            text: responseText,
            sender: 'bot',
            timestamp: new Date(),
            confidence: response.confidence,
            source: response.source || 'online_api'
          };
          console.log('✅ Using online response from:', response.source);
          console.log('✅ Response text length:', responseText.length);
        } catch (apiError) {
          console.error('❌ Backend API Error Details:', {
            message: apiError.message,
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            config: apiError.config?.url,
            fullError: apiError
          });
          console.log('🔄 Falling back to knowledge base due to error:', apiError.message);
          
          // API failed even though backend should be online
          const kbResponse = searchKnowledgeBase(text.trim());
          botMessage = {
            id: Date.now() + 1,
            text: kbResponse.answer + '\n\n⚠️ Note: Unable to connect to online service. Using local knowledge base.\n\nTip: Make sure the backend server is running with `python manage.py runserver`',
            sender: 'bot',
            timestamp: new Date(),
            confidence: kbResponse.confidence,
            source: 'knowledge_base_fallback'
          };
        }
      } 
      // Step 3: If offline, use knowledge base
      else {
        console.log('📴 Using offline mode - searching knowledge base...');
        const kbResponse = searchKnowledgeBase(text.trim());
        
        botMessage = {
          id: Date.now() + 1,
          text: kbResponse.answer,
          sender: 'bot',
          timestamp: new Date(),
          confidence: kbResponse.confidence,
          source: kbResponse.source
        };
        console.log('✅ Response from knowledge base - confidence:', kbResponse.confidence);
      }

      setMessages(prev => [...prev, botMessage]);
      
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
      <View
        style={[
          styles.messageBubble,
          item.sender === 'user' ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
          {item.text}
        </Text>
        
        {item.source && (
          <Text style={styles.sourceText}>
            {item.source === 'online_api' && '🌐 Online API'}
            {item.source === 'knowledge_base' && '📚 Knowledge Base (Offline)'}
            {item.source === 'knowledge_base_fallback' && '📚 Knowledge Base'}
            {item.source === 'offline_fallback' && '📴 Offline Mode'}
            {item.source === 'error_fallback' && '⚠️ Error Recovery'}
          </Text>
        )}
      </View>
    </View>
  );

  const suggestions = [
    { id: '1', text: "Help with my computer 💻" },
    { id: '2', text: "Study tips please 📚" },
    { id: '3', text: "Tell me a joke 😄" },
    { id: '4', text: "Test voice features 🎤" },
    { id: '5', text: "What's the meaning of life? 🤔" },
    { id: '6', text: "Random question! 🎲" },
    { id: '7', text: "EVSU campus info 🏫" },
  ];

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => sendMessage(item.text.replace(/[💻📚😄🎤🤔🎲🏫]/g, '').trim())}
    >
      <Text style={styles.suggestionText}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Starry Background */}
      <StarryBackground />

      {/* Large Orb in Center - Behind Content */}
      {messages.length <= 1 && (
        <View style={styles.centerOrbContainer} pointerEvents="none">
          <HolographicOrb size={Math.min(width * 0.6, 300)} animate={true} />
        </View>
      )}

      <KeyboardAvoidingView 
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerOrb}>
            <HolographicOrb size={36} animate={true} />
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>KonsultaBot</Text>
            <Text style={styles.headerSubtitle}>
              {!isOnline && '📴 No Internet - '}
              {isOnline && !isBackendOnline && '⚠️ Backend Offline - '}
              {isOnline && isBackendOnline && '🌐 Online - '}
              Your AI Assistant
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={checkConnectivity}
            disabled={isLoading}
          >
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color={isOnline && isBackendOnline ? lumaTheme.colors.primary : lumaTheme.colors.error} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowHistory(!showHistory)}
          >
            <MaterialIcons name="history" size={24} color={lumaTheme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleNewChat}
          >
            <MaterialIcons name="add-circle-outline" size={24} color={lumaTheme.colors.primary} />
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
  centerOrbContainer: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -Math.min(width * 0.3, 150),
    zIndex: 0,
  },
  header: {
    width: '100%',
    maxWidth: 768,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerOrb: {
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lumaTheme.colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: lumaTheme.colors.textSecondary,
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 768,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginVertical: 6,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: lumaTheme.colors.primary,
  },
  botMessage: {
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  botMessageText: {
    color: lumaTheme.colors.text,
    fontSize: 15,
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
    backgroundColor: 'rgba(30, 30, 40, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    width: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    color: lumaTheme.colors.primary,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 768,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: lumaTheme.colors.text,
    backgroundColor: 'rgba(40, 40, 50, 0.8)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: lumaTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(100, 100, 110, 0.3)',
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
