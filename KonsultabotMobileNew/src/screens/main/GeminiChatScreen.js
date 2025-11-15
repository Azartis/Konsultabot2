import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Text,
  IconButton,
  Avatar,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { apiService } from '../../services/apiService';

const { width, height } = Dimensions.get('window');

export default function GeminiChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  const languageOptions = [
    { value: 'english', label: 'English', flag: '🇺🇸' },
    { value: 'bisaya', label: 'Bisaya', flag: '🇵🇭' },
    { value: 'waray', label: 'Waray', flag: '🇵🇭' },
    { value: 'tagalog', label: 'Tagalog', flag: '🇵🇭' },
  ];

  const suggestedQuestions = [
    { text: "What programs are available?", icon: "school-outline" },
    { text: "Where is the library?", icon: "library-outline" },
    { text: "How do I enroll?", icon: "person-add-outline" },
    { text: "Campus facilities?", icon: "business-outline" },
  ];

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = {
      id: 'welcome',
      text: `Hello! I'm KonsultaBot 🤖\n\nI'm your AI assistant for EVSU Dulag campus. I can help you with:\n\n• Campus information and programs\n• Technical support issues\n• Multi-language conversations\n• Offline assistance\n\nWhat would you like to know today?`,
      isBot: true,
      timestamp: new Date(),
      typing: false,
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async (messageText = inputText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage = {
      id: 'typing',
      text: '',
      isBot: true,
      timestamp: new Date(),
      typing: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await apiService.sendMessage(messageText, language, sessionId);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response || response.data.message || 'I received your message!',
        isBot: true,
        timestamp: new Date(),
        mode: response.data.mode || 'online',
        typing: false,
      };

      setMessages(prev => [...prev, botMessage]);

      // Update session ID if provided
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      // Add offline response
      const offlineMessage = {
        id: (Date.now() + 1).toString(),
        text: getOfflineResponse(messageText),
        isBot: true,
        timestamp: new Date(),
        mode: 'offline',
        typing: false,
      };

      setMessages(prev => [...prev, offlineMessage]);
    } finally {
      setLoading(false);
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const getOfflineResponse = (message) => {
    const responses = {
      english: "I'm currently offline, but I can still help with basic EVSU Dulag information. The campus offers programs in Education, Business, and Computer Science. We have a library, computer lab, and various facilities available for students.",
      bisaya: "Offline ko karon, pero makatabang gihapon ko sa basic info sa EVSU Dulag. Naa'y programs sa Education, Business, ug Computer Science. Naa pud library, computer lab, ug uban pang facilities.",
      waray: "Offline ako karon, pero makakabulig pa ako han basic info han EVSU Dulag. Mayda programs ha Education, Business, ngan Computer Science. Mayda library, computer lab, ngan iba nga facilities.",
      tagalog: "Offline ako ngayon, pero makakatulong pa rin ako sa basic info ng EVSU Dulag. May mga programs sa Education, Business, at Computer Science. May library, computer lab, at iba pang facilities."
    };
    return responses[language] || responses.english;
  };

  const speakMessage = (text) => {
    Speech.speak(text, {
      language: language === 'english' ? 'en' : 'fil',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const renderMessage = ({ item, index }) => {
    if (item.typing) {
      return (
        <View style={styles.messageContainer}>
          <View style={[styles.messageBubble, styles.botBubble]}>
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        item.isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        {item.isBot && (
          <Avatar.Icon
            size={32}
            icon="robot"
            style={styles.botAvatar}
          />
        )}
        
        <Surface style={[
          styles.messageBubble,
          item.isBot ? styles.botBubble : styles.userBubble
        ]}>
          <Text style={[
            styles.messageText,
            item.isBot ? styles.botText : styles.userText
          ]}>
            {item.text}
          </Text>
          
          {item.mode && (
            <Text style={styles.modeIndicator}>
              {item.mode === 'offline' ? '🔌 Offline' : '🌐 Online'}
            </Text>
          )}
        </Surface>

        {item.isBot && (
          <TouchableOpacity
            onPress={() => speakMessage(item.text)}
            style={styles.speakButton}
          >
            <Ionicons name="volume-high-outline" size={16} color="#666" />
          </TouchableOpacity>
        )}

        {!item.isBot && (
          <Avatar.Text
            size={32}
            label="U"
            style={styles.userAvatar}
          />
        )}
      </View>
    );
  };

  const renderSuggestedQuestion = (question) => (
    <TouchableOpacity
      key={question.text}
      style={styles.suggestionChip}
      onPress={() => sendMessage(question.text)}
    >
      <Ionicons name={question.icon} size={16} color="#1976d2" />
      <Text style={styles.suggestionText}>{question.text}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#f8f9fa', '#ffffff']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar.Icon
            size={40}
            icon="robot"
            style={styles.headerAvatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>KonsultaBot</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? 'Typing...' : 'EVSU Dulag AI Assistant'}
            </Text>
          </View>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>
              {languageOptions.find(l => l.value === language)?.flag} {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => renderMessage({ item: message, index }))}
        
        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            <View style={styles.suggestionsGrid}>
              {suggestedQuestions.map(renderSuggestedQuestion)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <Surface style={styles.inputSurface}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about EVSU Dulag..."
            multiline
            maxLength={500}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            contentStyle={styles.inputContent}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={() => sendMessage()}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? "#fff" : "#999"} 
              />
            )}
          </TouchableOpacity>
        </Surface>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 2,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerAvatar: {
    backgroundColor: '#1976d2',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  languageButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  languageText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    backgroundColor: '#1976d2',
    marginRight: 8,
  },
  userAvatar: {
    backgroundColor: '#4caf50',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
  },
  botBubble: {
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#1976d2',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: '#1a1a1a',
  },
  userText: {
    color: '#fff',
  },
  modeIndicator: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  speakButton: {
    marginLeft: 8,
    padding: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 2,
    // Animation would be handled by Animated API in a real implementation
  },
  suggestionsContainer: {
    marginTop: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 6,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputSurface: {
    margin: 20,
    borderRadius: 25,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: 'transparent',
  },
  inputContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendButtonActive: {
    backgroundColor: '#1976d2',
  },
  sendButtonInactive: {
    backgroundColor: '#f0f0f0',
  },
});
