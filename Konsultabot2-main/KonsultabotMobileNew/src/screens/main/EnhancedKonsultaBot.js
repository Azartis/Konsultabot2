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
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../../theme/cleanTheme';

const { width, height } = Dimensions.get('window');

export default function EnhancedKonsultaBot() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const scrollViewRef = useRef();

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    const welcomeMessage = {
      id: Date.now(),
      text: "Hello! I'm KonsultaBot, your comprehensive AI assistant! 🤖\n\nI can help you with:\n• IT support and technical issues\n• Academic questions and study tips\n• Fun conversations and jokes\n• Silly or random questions\n• Creative discussions\n• Absolutely anything you're curious about!\n\nWhat would you like to chat about today?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome'
    };
    
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Try to get auth token
      const token = await AsyncStorage.getItem('access_token');
      
      if (token) {
        // Try enhanced API first
        const response = await axios.post('http://192.168.1.17:8000/api/v1/chat/', {
          query: userMessage.text
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 10000
        });

        const botMessage = {
          id: Date.now() + 1,
          text: response.data.response,
          sender: 'bot',
          timestamp: new Date(),
          confidence: response.data.ai_confidence
        };

        setMessages(prev => [...prev, botMessage]);
        setIsConnected(true);
      } else {
        // No auth token, use local response
        throw new Error('No authentication token');
      }

    } catch (error) {
      console.log('API error, using local response:', error.message);
      setIsConnected(false);
      
      // Use comprehensive local response
      const localResponse = getComprehensiveLocalResponse(userMessage.text);
      
      const botMessage = {
        id: Date.now() + 1,
        text: localResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: 'local'
      };

      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getComprehensiveLocalResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Greetings
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
      return "Hello there! 👋 I'm KonsultaBot, your friendly AI assistant! I'm here to help with anything - from serious IT questions to silly random thoughts. What's on your mind today?";
    }
    
    // IT Support
    if (lowerQuery.includes('computer') || lowerQuery.includes('tech') || lowerQuery.includes('it') || 
        lowerQuery.includes('password') || lowerQuery.includes('wifi') || lowerQuery.includes('internet') ||
        lowerQuery.includes('software') || lowerQuery.includes('hardware') || lowerQuery.includes('printer')) {
      return "I'd be happy to help with your tech issue! 💻\n\nHere are some common solutions:\n• Try restarting your device first\n• Check all cable connections\n• Update your software to the latest version\n• Clear browser cache and cookies\n• Contact EVSU IT support for advanced help\n\nWhat specific problem are you experiencing?";
    }
    
    // Academic Help
    if (lowerQuery.includes('study') || lowerQuery.includes('exam') || lowerQuery.includes('academic') ||
        lowerQuery.includes('homework') || lowerQuery.includes('assignment') || lowerQuery.includes('research') ||
        lowerQuery.includes('thesis') || lowerQuery.includes('project') || lowerQuery.includes('grade')) {
      return "Great academic question! 📚 Here are some helpful study tips:\n\n• Break complex topics into smaller, manageable parts\n• Create a consistent study schedule\n• Use active learning techniques like summarizing\n• Form study groups with classmates\n• Visit professors during office hours\n• Use EVSU library resources and databases\n• Practice with past exams\n• Take regular breaks to maintain focus\n\nWhat subject are you working on?";
    }
    
    // Fun/Silly Questions
    if (lowerQuery.includes('joke') || lowerQuery.includes('funny') || lowerQuery.includes('silly') ||
        lowerQuery.includes('weird') || lowerQuery.includes('random') || lowerQuery.includes('nonsense') ||
        lowerQuery.includes('banana') || lowerQuery.includes('unicorn') || lowerQuery.includes('dragon')) {
      const sillyResponses = [
        "Haha! That's a fun question! 😄 Here's a tech joke for you:\n\nWhy do programmers prefer dark mode?\nBecause light attracts bugs! 🐛\n\nGot any other silly questions for me?",
        "I love silly questions! 🦄 If unicorns went to EVSU, they'd probably major in Rainbow Engineering! What other wonderfully weird thoughts do you have?",
        "What a delightfully random question! 🎭 It's like asking why clouds don't wear shoes! ☁️👟 I'm here for both serious help and fun conversations - what else is on your curious mind?",
        "That's beautifully nonsensical! 🌈 Like a dancing refrigerator or a shy tornado! I love how creative your mind is. Ask me anything - practical or playful!"
      ];
      return sillyResponses[Math.floor(Math.random() * sillyResponses.length)];
    }
    
    // Creative Questions
    if (lowerQuery.includes('creative') || lowerQuery.includes('art') || lowerQuery.includes('draw') ||
        lowerQuery.includes('write') || lowerQuery.includes('design') || lowerQuery.includes('inspire')) {
      return "How wonderfully creative! 🎨 Here's some inspiration:\n\n• Art is about expressing what words cannot capture\n• Every blank page is a universe of possibilities\n• Creativity is intelligence having fun\n• Start with what you feel, not what you think\n• There are no mistakes in art, only discoveries\n\nWhat kind of creative project are you working on?";
    }
    
    // Philosophical Questions
    if (lowerQuery.includes('meaning') || lowerQuery.includes('life') || lowerQuery.includes('purpose') ||
        lowerQuery.includes('existence') || lowerQuery.includes('philosophy') || lowerQuery.includes('wisdom')) {
      return "That's a profound question! 🤔 Here's my perspective:\n\nLife's meaning often comes from the connections we make and the knowledge we share. Perhaps the purpose of education isn't just to learn facts, but to learn how to think. Every student's journey is unique, but we all share the quest for understanding.\n\nWhat aspects of existence are you pondering?";
    }
    
    // EVSU Specific
    if (lowerQuery.includes('evsu') || lowerQuery.includes('dulag') || lowerQuery.includes('campus') ||
        lowerQuery.includes('university') || lowerQuery.includes('school')) {
      return "Great to chat with someone from EVSU Dulag! 🏫\n\nOur campus has excellent facilities:\n• Modern IT labs and computer centers\n• Well-equipped library with online databases\n• Supportive faculty and staff\n• Beautiful campus environment\n\nEVSU is committed to academic excellence and student success. How can I help you make the most of your campus experience?";
    }
    
    // Very short input
    if (query.trim().length < 3) {
      return "That's quite brief! 😊 I'm here to help with anything you need. Whether it's:\n\n• Technical support\n• Study help\n• Fun conversations\n• Random thoughts\n• Creative discussions\n\nWhat's on your mind today?";
    }
    
    // Default comprehensive response
    return `That's an interesting question about "${query}"! 🤖\n\nI'm KonsultaBot, your comprehensive AI assistant, and I love all kinds of questions! Whether you need:\n\n• 🔧 IT support and technical help\n• 📚 Academic guidance and study tips\n• 😄 Fun conversations and jokes\n• 🎨 Creative inspiration\n• 🤔 Deep discussions\n• 🎲 Answers to random thoughts\n\nI'm here for you! What else would you like to explore?`;
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.botMessage,
          message.type === 'welcome' && styles.welcomeMessage
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.botMessageText
          ]}>
            {message.text}
          </Text>
          
          {message.confidence && (
            <Text style={styles.confidenceText}>
              AI Confidence: {Math.round(message.confidence * 100)}%
            </Text>
          )}
          
          {message.type === 'local' && (
            <Text style={styles.localIndicator}>
              💡 Local Response (Offline Mode)
            </Text>
          )}
          
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const getQuickSuggestions = () => [
    "Help with my computer 💻",
    "Study tips please 📚",
    "Tell me a joke 😄",
    "What's the meaning of life? 🤔",
    "Random question! 🎲",
    "EVSU campus info 🏫"
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KonsultaBot</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive AI Assistant {!isConnected && '(Offline)'}
          </Text>
          {!isConnected && (
            <View style={styles.offlineIndicator}>
              <MaterialIcons name="wifi-off" size={16} color="#EF4444" />
              <Text style={styles.offlineText}>Using Local AI</Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestions */}
        {messages.length <= 1 && (
          <ScrollView 
            horizontal 
            style={styles.suggestionsContainer}
            showsHorizontalScrollIndicator={false}
          >
            {getQuickSuggestions().map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => setInputText(suggestion.replace(/[💻📚😄🤔🎲🏫]/g, '').trim())}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything - serious, silly, or random! 😊"
            placeholderTextColor={theme.colors.placeholder}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={(!inputText.trim() || isLoading) ? theme.colors.placeholder : 'white'} 
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
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 10,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 5,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 5,
  },
  botMessage: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  welcomeMessage: {
    backgroundColor: '#F0F9FF',
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: theme.colors.text,
  },
  confidenceText: {
    fontSize: 10,
    color: theme.colors.placeholder,
    marginTop: 5,
    fontStyle: 'italic',
  },
  localIndicator: {
    fontSize: 10,
    color: '#10B981',
    marginTop: 5,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.placeholder,
    marginTop: 5,
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: theme.colors.placeholder,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  suggestionButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  suggestionText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.disabled,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
});
