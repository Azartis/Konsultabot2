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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { apiService } from '../../services/apiService';

const { width } = Dimensions.get('window');

export default function KonsultaBotScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  const languageOptions = [
    { value: 'english', label: 'English', flag: '🇺🇸' },
    { value: 'bisaya', label: 'Bisaya', flag: '🇵🇭' },
    { value: 'waray', label: 'Waray', flag: '🇵🇭' },
    { value: 'tagalog', label: 'Tagalog', flag: '🇵🇭' },
  ];

  const suggestedQuestions = [
    "My computer won't start",
    "WiFi connection problems",
    "Printer not working",
    "Software installation help"
  ];

  useEffect(() => {
    initializeBot();
    checkConnection();
  }, []);

  const initializeBot = () => {
    const welcomeMessage = {
      id: 'welcome',
      text: `Hello! I'm KonsultaBot 🤖\n\nI'm your intelligent IT assistant for EVSU Dulag Campus. I can help you with:\n\n• Computer troubleshooting\n• Network and WiFi issues\n• Software problems\n• IT support guidance\n\nI work in both online and offline modes to ensure you always get help!\n\nWhat IT issue can I help you with today?`,
      isBot: true,
      timestamp: new Date(),
      mode: 'system'
    };
    setMessages([welcomeMessage]);
  };

  const checkConnection = async () => {
    try {
      // Test connection to backend
      const response = await fetch(apiService.getBaseUrl() + '/health', {
        method: 'GET',
        timeout: 3000
      });
      setIsOnline(response.ok);
    } catch (error) {
      setIsOnline(false);
    }
  };

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

    // DECISION TREE LOGIC: Try Online Mode First
    let botResponse = await tryOnlineMode(messageText);
    
    // If online mode fails, switch to offline mode
    if (!botResponse) {
      botResponse = await tryOfflineMode(messageText);
    }

    // Remove typing indicator and add response
    setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
    
    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: botResponse.text,
      isBot: true,
      timestamp: new Date(),
      mode: botResponse.mode,
      typing: false,
    };

    setMessages(prev => [...prev, botMessage]);
    setLoading(false);
    setIsTyping(false);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const tryOnlineMode = async (message) => {
    try {
      // Attempt API call to Gemini through backend
      const response = await apiService.sendMessage(message, language);
      setIsOnline(true);
      
      return {
        text: response.data.response || response.data.message,
        mode: 'online'
      };
    } catch (error) {
      console.log('Online mode failed, switching to offline:', error.message);
      setIsOnline(false);
      return null;
    }
  };

  const tryOfflineMode = async (message) => {
    // OFFLINE MODE: Knowledge-based responses with decision tree
    const messageLower = message.toLowerCase();
    
    // Check if it's an IT-related question
    if (isITRelated(messageLower)) {
      return {
        text: getITTroubleshootingResponse(messageLower),
        mode: 'offline'
      };
    }
    
    // For non-IT questions in offline mode, guide toward IT support
    return {
      text: getOfflineGuidanceResponse(message),
      mode: 'offline'
    };
  };

  const isITRelated = (message) => {
    const itKeywords = [
      'computer', 'laptop', 'pc', 'wifi', 'internet', 'network', 'printer', 
      'software', 'program', 'app', 'install', 'error', 'bug', 'crash', 
      'slow', 'freeze', 'virus', 'malware', 'password', 'login', 'email',
      'microsoft', 'windows', 'office', 'excel', 'word', 'powerpoint',
      'browser', 'chrome', 'firefox', 'website', 'download', 'upload',
      'file', 'folder', 'backup', 'restore', 'update', 'upgrade',
      'hardware', 'mouse', 'keyboard', 'monitor', 'screen', 'speaker',
      'microphone', 'camera', 'usb', 'bluetooth', 'driver'
    ];
    
    return itKeywords.some(keyword => message.includes(keyword));
  };

  const getITTroubleshootingResponse = (message) => {
    const responses = {
      english: {
        computer: "I can help with your computer issue! Let me guide you step by step:\n\n🔍 **First, let's identify the problem:**\n• What exactly happens when you try to use your computer?\n• Do you see any error messages?\n• When did this problem start?\n• What were you doing when it first occurred?\n\n💡 **Common quick fixes:**\n• Try restarting your computer\n• Check all cable connections\n• Make sure power is connected\n\nOnce you provide more details, I can give you specific troubleshooting steps!",
        
        wifi: "WiFi problems can be frustrating! Let's troubleshoot this together:\n\n🔍 **Tell me more:**\n• Can you see WiFi networks but can't connect?\n• Is the WiFi completely not showing up?\n• Does it connect but no internet access?\n• Is it slow or keeps disconnecting?\n\n🛠️ **Quick fixes to try:**\n1. **Restart your WiFi:** Turn off WiFi, wait 10 seconds, turn back on\n2. **Restart router:** Unplug for 30 seconds, plug back in\n3. **Forget and reconnect:** Go to WiFi settings, forget network, reconnect\n4. **Check password:** Make sure you're using the correct WiFi password\n\nWhat specific WiFi issue are you experiencing?",
        
        printer: "Printer issues are common! Let's get it working:\n\n🔍 **What's happening exactly:**\n• Printer won't turn on?\n• Computer can't find the printer?\n• Prints blank pages or poor quality?\n• Paper jams or feeding issues?\n\n🛠️ **Basic troubleshooting:**\n1. **Check connections:** USB cable or WiFi connection\n2. **Power cycle:** Turn printer off, wait 30 seconds, turn back on\n3. **Check supplies:** Paper, ink/toner levels\n4. **Clear paper jams:** Check all paper paths\n5. **Update drivers:** Download latest printer drivers\n\nWhat specific printer problem are you facing?",
        
        software: "Software problems can have many causes. Let's narrow it down:\n\n🔍 **Tell me more:**\n• What software/program is having issues?\n• What error message do you see (if any)?\n• Does it crash, freeze, or not start at all?\n• Did this start after an update or installation?\n\n🛠️ **General software fixes:**\n1. **Restart the program** completely\n2. **Restart your computer**\n3. **Run as administrator** (right-click → Run as administrator)\n4. **Check for updates** in the software\n5. **Reinstall the program** if necessary\n\nWhich software is giving you trouble, and what exactly happens?",
        
        general: "I'm here to help with your IT issue! To give you the best troubleshooting steps, I need more details:\n\n🔍 **Please tell me:**\n• What device or software is affected?\n• What exactly happens, and since when?\n• Any error messages you see?\n• What have you already tried?\n\n💡 **I can help with:**\n• Computer and laptop issues\n• WiFi and internet problems\n• Printer troubleshooting\n• Software installation and errors\n• Email and Office applications\n• Hardware connection issues\n\nDescribe your IT problem and I'll guide you through the solution step by step!"
      }
    };

    const langResponses = responses[language] || responses.english;

    if (message.includes('computer') || message.includes('laptop') || message.includes('pc')) {
      return langResponses.computer;
    }
    if (message.includes('wifi') || message.includes('internet') || message.includes('network')) {
      return langResponses.wifi;
    }
    if (message.includes('printer') || message.includes('print')) {
      return langResponses.printer;
    }
    if (message.includes('software') || message.includes('program') || message.includes('app')) {
      return langResponses.software;
    }

    return langResponses.general;
  };

  const getOfflineGuidanceResponse = (message) => {
    return `I specialize in IT support for students and faculty at EVSU Dulag Campus. While I'm currently offline, I can still help with your IT issues!\n\n🔍 **I can help with your IT issue even offline. Could you share more details?**\n• What device or software is affected?\n• What exactly happens, and since when?\n• Any errors you see?\n• What have you already tried?\n\n💻 **My IT expertise includes:**\n• Computer troubleshooting\n• Network and WiFi issues\n• Printer problems\n• Software installation help\n• Email and Office support\n\nPlease describe your IT problem and I'll guide you through the solution!`;
  };

  const speakMessage = (text) => {
    Speech.speak(text, {
      language: language === 'english' ? 'en' : 'fil',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const renderMessage = (message, index) => {
    if (message.typing) {
      return (
        <View key="typing" style={styles.messageContainer}>
          <View style={styles.botAvatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
          <View style={[styles.messageBubble, styles.botBubble]}>
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>KonsultaBot is thinking...</Text>
              <ActivityIndicator size="small" color="#666" style={{ marginLeft: 8 }} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        {message.isBot && (
          <View style={styles.botAvatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          message.isBot ? styles.botBubble : styles.userBubble
        ]}>
          <Text style={[
            styles.messageText,
            message.isBot ? styles.botText : styles.userText
          ]}>
            {message.text}
          </Text>
          
          {message.mode && message.mode !== 'system' && (
            <Text style={styles.modeIndicator}>
              {message.mode === 'offline' ? '🔌 Offline Mode' : '🌐 Online Mode (Gemini)'}
            </Text>
          )}
        </View>

        {message.isBot && !message.typing && (
          <TouchableOpacity
            onPress={() => speakMessage(message.text)}
            style={styles.speakButton}
          >
            <Ionicons name="volume-high-outline" size={16} color="#666" />
          </TouchableOpacity>
        )}

        {!message.isBot && (
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>🤖</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>KonsultaBot</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? 'Thinking...' : isOnline ? 'Online (Gemini AI)' : 'Offline Mode'}
            </Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: isOnline ? '#4caf50' : '#ff9800' }
            ]} />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        
        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Common IT Issues:</Text>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => sendMessage(question)}
              >
                <Ionicons name="help-circle-outline" size={16} color="#1976d2" />
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputSurface}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your IT problem..."
            multiline
            maxLength={500}
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
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 20,
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
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
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
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
