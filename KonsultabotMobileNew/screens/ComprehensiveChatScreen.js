/**
 * Comprehensive Chat Screen for KonsultaBot
 * Handles ALL types of questions: serious, silly, nonsense, academic, etc.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAuthData, createAuthenticatedAxios } from '../utils/authUtils';

const { width, height } = Dimensions.get('window');

export default function ComprehensiveChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const authData = await getAuthData();
      if (authData.userData) {
        setUserData(JSON.parse(authData.userData));
        
        // Add welcome message
        const welcomeMessage = {
          id: Date.now(),
          text: getWelcomeMessage(JSON.parse(authData.userData)),
          sender: 'bot',
          timestamp: new Date(),
          type: 'welcome'
        };
        
        setMessages([welcomeMessage]);
        
        // Get conversation starter
        getConversationStarter();
      }
    } catch (error) {
      console.error('Chat initialization error:', error);
    }
  };

  const getWelcomeMessage = (user) => {
    const roleMessages = {
      admin: `Welcome back, Administrator ${user.first_name || user.username}! 👑\n\nI'm your comprehensive AI assistant. I can help with:\n• System management questions\n• Technical support\n• Academic discussions\n• Fun conversations\n• Silly questions\n• Anything else on your mind!\n\nWhat would you like to chat about today?`,
      
      it_staff: `Hello, ${user.first_name || user.username}! 🔧\n\nAs IT staff, I can assist you with:\n• Technical troubleshooting\n• System administration\n• User support guidance\n• Academic tech questions\n• Random tech discussions\n• Even silly tech jokes!\n\nHow can I help you today?`,
      
      student: `Hi there, ${user.first_name || user.username}! 🎓\n\nI'm KonsultaBot, your friendly AI companion! I can help with:\n• IT support and tech problems\n• Study tips and academic help\n• Fun conversations and jokes\n• Silly or random questions\n• Creative discussions\n• Absolutely anything you're curious about!\n\nDon't be shy - ask me anything, serious or silly! 😊`
    };
    
    return roleMessages[user.role] || roleMessages.student;
  };

  const getConversationStarter = async () => {
    try {
      const axios = await createAuthenticatedAxios();
      const response = await axios.get('http://192.168.1.17:8000/api/v1/chat/conversation-starter');
      
      if (response.data.conversation_starter) {
        setTimeout(() => {
          const starterMessage = {
            id: Date.now() + 1,
            text: `💭 **Conversation Starter**: ${response.data.conversation_starter}`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'starter'
          };
          setMessages(prev => [...prev, starterMessage]);
        }, 2000);
      }
    } catch (error) {
      console.log('Could not get conversation starter:', error);
    }
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
      const axios = await createAuthenticatedAxios();
      const response = await axios.post('http://192.168.1.17:8000/api/v1/chat/', {
        query: userMessage.text
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        confidence: response.data.ai_confidence,
        responseType: response.data.response_type
      };

      setMessages(prev => [...prev, botMessage]);

      // Add conversation starter if provided
      if (response.data.conversation_starter) {
        setTimeout(() => {
          const starterMessage = {
            id: Date.now() + 2,
            text: `💭 **Try asking**: ${response.data.conversation_starter}`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'suggestion'
          };
          setMessages(prev => [...prev, starterMessage]);
        }, 1500);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: getOfflineResponse(userMessage.text),
        sender: 'bot',
        timestamp: new Date(),
        type: 'offline'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOfflineResponse = (query) => {
    const offlineResponses = [
      "I'm having a little trouble connecting right now, but I'm still here! 🤖 Your question about '" + query + "' is interesting! While I get my connection sorted, feel free to ask me anything else!",
      
      "Oops! My internet seems to be taking a coffee break ☕ But don't worry, I'm still your friendly KonsultaBot! That's a great question - try asking me again in a moment!",
      
      "Technical hiccup on my end! 🔧 But hey, that's what makes conversations interesting, right? I'm still here and ready to chat about anything - serious, silly, or completely random!",
      
      "My circuits got a bit tangled there! 🌐 But I'm still your comprehensive AI buddy. Whether you want to talk tech, academics, or ask me why bananas don't wear shoes, I'm ready!"
    ];
    
    return offlineResponses[Math.floor(Math.random() * offlineResponses.length)];
  };

  const getQuickSuggestions = () => {
    const suggestions = [
      "Tell me a joke! 😄",
      "Help with my computer",
      "Study tips please",
      "What's 2+2?",
      "Why do cats purr?",
      "Random question!",
      "I'm feeling creative",
      "Tech support needed"
    ];
    
    return suggestions;
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion);
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubbles" size={16} color="white" />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.botMessage,
          message.type === 'welcome' && styles.welcomeMessage,
          message.type === 'starter' && styles.starterMessage,
          message.type === 'suggestion' && styles.suggestionMessage
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
          
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="white" />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#4C9EF6', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>KonsultaBot</Text>
            <Text style={styles.headerSubtitle}>
              Comprehensive AI • Handles Everything! 🤖✨
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => {
              Alert.alert(
                'KonsultaBot Features',
                '• IT Support & Tech Help\n• Academic Assistance\n• Fun & Silly Questions\n• Creative Discussions\n• Random Conversations\n• EVSU Campus Info\n\nAsk me anything!',
                [{ text: 'Got it!', style: 'default' }]
              );
            }}
          >
            <Ionicons name="information-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4C9EF6" />
            <Text style={styles.loadingText}>KonsultaBot is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <ScrollView 
          horizontal 
          style={styles.suggestionsContainer}
          showsHorizontalScrollIndicator={false}
        >
          {getQuickSuggestions().map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything - serious, silly, or random! 😊"
            placeholderTextColor="#9CA3AF"
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
            <Ionicons 
              name="send" 
              size={20} 
              color={(!inputText.trim() || isLoading) ? "#9CA3AF" : "white"} 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.inputHint}>
          💡 Try: "Help with my computer", "Tell me a joke", "Study tips", or anything random!
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
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
  menuButton: {
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4C9EF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 5,
  },
  userMessage: {
    backgroundColor: '#4C9EF6',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeMessage: {
    backgroundColor: '#F0F9FF',
    borderColor: '#4C9EF6',
    borderWidth: 1,
  },
  starterMessage: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
    borderWidth: 1,
  },
  suggestionMessage: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
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
    color: '#1F2937',
  },
  confidenceText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 5,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
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
    color: '#6B7280',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  suggestionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    color: '#4C9EF6',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4C9EF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
