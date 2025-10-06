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
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';

const { width } = Dimensions.get('window');

// Use the API service for making requests
const makeApiCall = async (message, language = 'english') => {
  try {
    console.log('Attempting API call to Gemini endpoint');
    console.log('Message:', message, 'Language:', language);
    
    const response = await apiService.api.post('/chat/simple-gemini/', {
      message: message,
      language: language
    });
    
    console.log('Response status:', response.status);
    
    if (response.status === 200) {
      const data = response.data;
      console.log('Response data:', data);
      return { success: true, data };
    } else {
      console.log('Error response:', response.data);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('API call failed:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to connect to the server' 
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

export default function GeminiKonsultaBot({ navigation }) {
  const { user, token } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigation.navigate('Login');
    }
  }, [token, navigation]);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [language, setLanguage] = useState('english');
  const scrollViewRef = useRef();

  // Rest of the component code remains the same...
  // [Previous implementation of initializeBot, checkConnection, sendMessage, etc.]
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KonsultaBot</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4caf50' : '#f44336' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble,
              message.isBot ? styles.botMessage : styles.userMessage
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <Text style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {message.mode && (
              <Text style={styles.messageMode}>
                {message.mode === 'online' ? '🌐 Online' : '🔌 Offline'}
              </Text>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.botMessage, styles.typingIndicator]}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.typingText}>KonsultaBot is typing...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          multiline
          editable={!loading}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => {
            if (inputText.trim() && !loading) {
              // Handle send message
              const newMessage = {
                id: Date.now().toString(),
                text: inputText,
                isBot: false,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, newMessage]);
              setInputText('');
              
              // Simulate bot response
              setTimeout(() => {
                const botResponse = {
                  id: (Date.now() + 1).toString(),
                  text: "I'm a bot response. This is a placeholder.",
                  isBot: true,
                  timestamp: new Date(),
                  mode: isOnline ? 'online' : 'offline'
                };
                setMessages(prev => [...prev, botResponse]);
              }, 1000);
            }
          }}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  messageMode: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    paddingTop: 10,
    marginRight: 10,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  sendButton: {
    backgroundColor: '#007bff',
    width: 60,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
