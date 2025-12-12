import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  Chip,
  Menu,
  Divider,
  ActivityIndicator,
  IconButton,
  Surface,
  Avatar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import VoiceHelper from '../../utils/voiceHelper';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { theme, spacing, borderRadius } from '../../theme/cleanTheme';
import { LinearGradient } from 'expo-linear-gradient';
import HapticsHelper from '../../utils/hapticsHelper';

const { width, height } = Dimensions.get('window');

export default function EnhancedChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [sessionId, setSessionId] = useState(null);
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [quickActions, setQuickActions] = useState([]);
  
  const { user } = useAuth();
  const flatListRef = useRef(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const languageOptions = [
    { value: 'english', label: '🇺🇸 English', flag: '🇺🇸' },
    { value: 'bisaya', label: '🇵🇭 Bisaya', flag: '🇵🇭' },
    { value: 'waray', label: '🇵🇭 Waray', flag: '🇵🇭' },
    { value: 'tagalog', label: '🇵🇭 Tagalog', flag: '🇵🇭' },
  ];

  const commonIssues = [
    { id: 1, text: "WiFi not working", icon: "wifi-outline" },
    { id: 2, text: "Printer issues", icon: "print-outline" },
    { id: 3, text: "Computer slow", icon: "desktop-outline" },
    { id: 4, text: "MS Office help", icon: "document-text-outline" },
    { id: 5, text: "Password reset", icon: "key-outline" },
  ];

  useEffect(() => {
    initializeChat();
    setupVoiceRecognition();
    checkConnectionStatus();
    
    return () => {
      VoiceHelper.destroy();
    };
  }, []);

  useEffect(() => {
    if (isTyping) {
      startTypingAnimation();
    } else {
      stopTypingAnimation();
    }
  }, [isTyping]);

  const initializeChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      text: `👋 Hi ${user?.name || 'there'}! I'm KonsultaBot, your IT support assistant at EVSU Dulag Campus.\n\n🔧 I can help you with:\n• WiFi and network issues\n• Printer problems\n• Computer troubleshooting\n• MS Office support\n• And much more!\n\nHow can I assist you today?`,
      sender: 'bot',
      timestamp: new Date(),
      mode: 'welcome',
      avatar: '🤖'
    };
    setMessages([welcomeMessage]);
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        timeout: 3000,
      });
      setConnectionStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setConnectionStatus('offline');
    }
  };

  const setupVoiceRecognition = () => {
    if (VoiceHelper.isAvailable()) {
      VoiceHelper.on('SpeechStart', () => setIsRecording(true));
      VoiceHelper.on('SpeechEnd', () => setIsRecording(false));
      VoiceHelper.on('SpeechResults', (e) => {
      if (e.value && e.value[0]) {
        setInputText(e.value[0]);
      }
      });
      VoiceHelper.on('SpeechError', (e) => {
      console.error('Speech recognition error:', e);
      setIsRecording(false);
      Alert.alert('Voice Recognition Error', 'Please try again or type your message.');
      });
    }
  };

  const startTypingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopTypingAnimation = () => {
    typingAnimation.setValue(0);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const sendMessage = async (messageText = inputText.trim()) => {
    if (!messageText) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      avatar: user?.avatar || '👤'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await apiService.sendMessage({
        message: messageText,
        language,
        sessionId,
        userId: user?.id,
      });

      setIsTyping(false);

      const botMessage = {
        id: Date.now() + 1,
        text: response.response || response.message || 'I apologize, but I encountered an issue processing your request.',
        sender: 'bot',
        timestamp: new Date(),
        mode: response.mode || 'offline',
        source: response.source || 'unknown',
        queryId: response.query_id,
        avatar: response.mode === 'online' ? '🤖' : '📚'
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Update connection status based on response
      if (response.mode) {
        setConnectionStatus(response.mode);
      }

      // Generate quick actions based on response
      generateQuickActions(messageText, response);

    } catch (error) {
      setIsTyping(false);
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: `🔧 **KonsultaBot (Offline Mode)**\n\nI'm having trouble connecting right now, but I can still help! Here are some common solutions:\n\n• **WiFi Issues:** Restart your router and reconnect\n• **Printer Problems:** Check connections and restart printer\n• **Slow Computer:** Close unnecessary programs\n\nFor immediate help, visit the IT office at EVSU Dulag Campus.`,
        sender: 'bot',
        timestamp: new Date(),
        mode: 'offline',
        avatar: '📚'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const generateQuickActions = (query, response) => {
    const queryLower = query.toLowerCase();
    let actions = [];

    if (queryLower.includes('wifi') || queryLower.includes('internet')) {
      actions = [
        { text: "Check router status", action: "My router lights are blinking" },
        { text: "Forget network", action: "How to forget WiFi network" },
        { text: "Network password", action: "I forgot my WiFi password" }
      ];
    } else if (queryLower.includes('printer') || queryLower.includes('print')) {
      actions = [
        { text: "Paper jam", action: "My printer has a paper jam" },
        { text: "Driver issues", action: "Printer driver not working" },
        { text: "Print queue", action: "Clear print queue" }
      ];
    } else if (queryLower.includes('slow') || queryLower.includes('computer')) {
      actions = [
        { text: "Check disk space", action: "How to check disk space" },
        { text: "Task manager", action: "Open task manager" },
        { text: "Restart computer", action: "Should I restart my computer" }
      ];
    }

    setQuickActions(actions);
  };

  const startVoiceRecording = async () => {
    try {
      if (!VoiceHelper.isAvailable()) {
        Alert.alert('Voice Not Available', 'Voice recognition is not available in Expo Go. Please use text input.');
        return;
      }
      await Audio.requestPermissionsAsync();
      const started = await VoiceHelper.start('en-US');
      if (started) {
        HapticsHelper.impactAsync('Medium');
      startPulseAnimation();
      } else {
        Alert.alert('Permission Required', 'Please enable microphone access to use voice input.');
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      Alert.alert('Permission Required', 'Please enable microphone access to use voice input.');
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (VoiceHelper.isAvailable()) {
        await VoiceHelper.stop();
      }
      pulseAnimation.setValue(1);
      HapticsHelper.impactAsync('Light');
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  const speakMessage = (text) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      const cleanText = text.replace(/\*\*|\*|#|`/g, '').replace(/\n+/g, '. ');
      Speech.speak(cleanText, {
        language: language === 'english' ? 'en-US' : 'en-US',
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === 'user';
    const isLastMessage = index === messages.length - 1;

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
        {!isUser && (
          <Avatar.Text 
            size={32} 
            label={item.avatar} 
            style={[styles.avatar, { backgroundColor: item.mode === 'online' ? theme.colors.primary : theme.colors.secondary }]}
          />
        )}
        
        <Surface style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
          isLastMessage && !isUser && styles.lastBotMessage
        ]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
            {item.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            
            {!isUser && (
              <View style={styles.messageActions}>
                {item.mode && (
                  <Chip 
                    mode="outlined" 
                    compact 
                    style={[styles.modeChip, { backgroundColor: item.mode === 'online' ? '#e8f5e8' : '#fff3e0' }]}
                    textStyle={{ fontSize: 10 }}
                  >
                    {item.mode === 'online' ? '🌐 Online' : '📚 Offline'}
                  </Chip>
                )}
                
                <IconButton
                  icon={isSpeaking ? "volume-high" : "volume-medium"}
                  size={16}
                  onPress={() => speakMessage(item.text)}
                  style={styles.speakButton}
                />
              </View>
            )}
          </View>
        </Surface>
        
        {isUser && (
          <Avatar.Text 
            size={32} 
            label={item.avatar} 
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <Avatar.Text 
          size={32} 
          label="🤖" 
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        />
        <Surface style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
          <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
            <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
          </View>
          <Text style={styles.typingText}>KonsultaBot is typing...</Text>
        </Surface>
      </View>
    );
  };

  const renderQuickActions = () => {
    if (quickActions.length === 0) return null;

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>💡 Quick Actions:</Text>
        <View style={styles.quickActionsList}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionButton}
              onPress={() => sendMessage(action.action)}
            >
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderCommonIssues = () => {
    if (messages.length > 1) return null;

    return (
      <View style={styles.commonIssuesContainer}>
        <Text style={styles.commonIssuesTitle}>🔧 Common IT Issues:</Text>
        <View style={styles.commonIssuesList}>
          {commonIssues.map((issue) => (
            <TouchableOpacity
              key={issue.id}
              style={styles.commonIssueButton}
              onPress={() => sendMessage(issue.text)}
            >
              <Ionicons name={issue.icon} size={20} color={theme.colors.primary} />
              <Text style={styles.commonIssueText}>{issue.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#f8f9fa', '#ffffff']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar.Text size={40} label="🤖" style={{ backgroundColor: theme.colors.primary }} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>KonsultaBot</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'online' ? '#4caf50' : '#ff9800' }]} />
              <Text style={styles.statusText}>
                {connectionStatus === 'online' ? 'Online' : 'Offline Mode'}
              </Text>
            </View>
          </View>
          
          <Menu
            visible={languageMenuVisible}
            onDismiss={() => setLanguageMenuVisible(false)}
            anchor={
              <IconButton
                icon="translate"
                size={24}
                onPress={() => setLanguageMenuVisible(true)}
              />
            }
          >
            {languageOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setLanguage(option.value);
                  setLanguageMenuVisible(false);
                }}
                title={option.label}
                leadingIcon={() => <Text>{option.flag}</Text>}
              />
            ))}
          </Menu>
        </View>
      </Surface>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        {renderCommonIssues()}
        {renderQuickActions()}

        {/* Input Area */}
        <Surface style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me about IT issues..."
              placeholderTextColor={theme.colors.placeholder}
              multiline
              maxLength={500}
              mode="outlined"
              dense
            />
            
            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
              <IconButton
                icon={isRecording ? "microphone" : "microphone-outline"}
                size={24}
                mode="contained"
                style={[styles.voiceButton, isRecording && styles.recordingButton]}
                onPressIn={startVoiceRecording}
                onPressOut={stopVoiceRecording}
              />
            </Animated.View>
            
            <IconButton
              icon="send"
              size={24}
              mode="contained"
              style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || loading}
            />
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  messagesContent: {
    paddingVertical: spacing.sm,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: spacing.xs,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  botBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  lastBotMessage: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: theme.colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  timestamp: {
    fontSize: 11,
    color: theme.colors.placeholder,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeChip: {
    height: 20,
    marginRight: spacing.xs,
  },
  speakButton: {
    margin: 0,
  },
  typingBubble: {
    backgroundColor: '#f0f0f0',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: spacing.xs,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: theme.colors.placeholder,
  },
  commonIssuesContainer: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  commonIssuesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  commonIssuesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  commonIssueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  commonIssueText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    color: theme.colors.text,
  },
  quickActionsContainer: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  quickActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  inputContainer: {
    padding: spacing.sm,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    marginRight: spacing.xs,
    maxHeight: 100,
  },
  voiceButton: {
    backgroundColor: theme.colors.secondary,
    marginRight: spacing.xs,
  },
  recordingButton: {
    backgroundColor: theme.colors.error,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
  },
});
