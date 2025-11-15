import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import HolographicOrb from '../components/HolographicOrb';
import { lumaTheme } from '../theme/lumaTheme';

const { width } = Dimensions.get('window');

export default function LumaChatScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Welcome message
    const welcomeMessage = {
      id: Date.now(),
      text: "Hello! I'm KonsultaBot, your AI assistant! 🤖\n\nHow can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiService.sendMessage(inputText.trim());
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.message || response.response || 'I received your message!',
        sender: 'bot',
        timestamp: new Date(),
        source: response.source || 'local_ai',
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Message error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again!",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    const slideAnim = useRef(new Animated.Value(30)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatar}>
            <LinearGradient
              colors={lumaTheme.gradients.orb}
              style={styles.botAvatarGradient}
            >
              <MaterialIcons name="smart-toy" size={20} color={lumaTheme.colors.text} />
            </LinearGradient>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.text}
          </Text>
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.first_name?.[0] || user?.email?.[0] || 'U'}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const quickActions = [
    { icon: 'translate', label: 'Smart Translation', gradient: ['#FF3B9A', '#8B5CF6'] },
    { icon: 'image', label: 'Image Generation', gradient: ['#4F8EFF', '#00FFF0'] },
    { icon: 'lightbulb', label: 'Get Ideas', gradient: ['#F59E0B', '#EF4444'] },
    { icon: 'schedule', label: 'Task Planner', gradient: ['#10B981', '#3B82F6'] },
  ];

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={lumaTheme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>KonsultaBot</Text>
            <Text style={styles.headerSubtitle}>AI Assistant • Online</Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <MaterialIcons name="person" size={24} color={lumaTheme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 1 && (
            <Animated.View style={[styles.orbContainer, { opacity: fadeAnim }]}>
              <HolographicOrb size={120} animate={true} />
            </Animated.View>
          )}

          {messages.map(renderMessage)}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.thinkingDots}>
                <View style={[styles.thinkingDot, styles.thinkingDot1]} />
                <View style={[styles.thinkingDot, styles.thinkingDot2]} />
                <View style={[styles.thinkingDot, styles.thinkingDot3]} />
              </View>
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <Animated.View style={[styles.quickActionsContainer, { opacity: fadeAnim }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionCard}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.quickActionGradient}
                  >
                    <MaterialIcons name={action.icon} size={24} color={lumaTheme.colors.text} />
                  </LinearGradient>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={lumaTheme.colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity style={styles.attachButton}>
              <MaterialIcons name="add" size={24} color={lumaTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {inputText.trim() ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={lumaTheme.gradients.button}
                style={styles.sendButtonGradient}
              >
                <MaterialIcons name="send" size={20} color={lumaTheme.colors.text} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton} activeOpacity={0.8}>
              <MaterialIcons name="mic" size={24} color={lumaTheme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: lumaTheme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : lumaTheme.spacing.md,
    paddingBottom: lumaTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lumaTheme.colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: lumaTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: lumaTheme.fontSize.lg,
    fontWeight: lumaTheme.fontWeight.semibold,
    color: lumaTheme.colors.text,
  },
  headerSubtitle: {
    fontSize: lumaTheme.fontSize.xs,
    color: lumaTheme.colors.textSecondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: lumaTheme.spacing.md,
  },
  orbContainer: {
    alignItems: 'center',
    marginVertical: lumaTheme.spacing.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: lumaTheme.spacing.md,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: lumaTheme.spacing.sm,
  },
  botAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: lumaTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: lumaTheme.spacing.sm,
  },
  userAvatarText: {
    color: lumaTheme.colors.text,
    fontSize: lumaTheme.fontSize.sm,
    fontWeight: lumaTheme.fontWeight.bold,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    borderRadius: lumaTheme.borderRadius.lg,
    padding: lumaTheme.spacing.md,
  },
  userBubble: {
    backgroundColor: lumaTheme.colors.userBubble,
  },
  botBubble: {
    backgroundColor: lumaTheme.colors.surface,
    borderWidth: 1,
    borderColor: lumaTheme.colors.border,
  },
  messageText: {
    fontSize: lumaTheme.fontSize.md,
    color: lumaTheme.colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: lumaTheme.colors.text,
  },
  timestamp: {
    fontSize: lumaTheme.fontSize.xs,
    color: lumaTheme.colors.textMuted,
    marginTop: lumaTheme.spacing.xs,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: lumaTheme.spacing.md,
  },
  thinkingDots: {
    flexDirection: 'row',
    marginBottom: lumaTheme.spacing.sm,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: lumaTheme.colors.primary,
  },
  thinkingDot1: {
    opacity: 0.3,
  },
  thinkingDot2: {
    opacity: 0.6,
  },
  thinkingDot3: {
    opacity: 1,
  },
  loadingText: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.textSecondary,
  },
  quickActionsContainer: {
    paddingVertical: lumaTheme.spacing.md,
    paddingLeft: lumaTheme.spacing.md,
  },
  quickActionCard: {
    marginRight: lumaTheme.spacing.md,
    alignItems: 'center',
    width: 100,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: lumaTheme.spacing.sm,
  },
  quickActionLabel: {
    fontSize: lumaTheme.fontSize.xs,
    color: lumaTheme.colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: lumaTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: lumaTheme.colors.border,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lumaTheme.colors.surface,
    borderRadius: lumaTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: lumaTheme.colors.border,
    paddingHorizontal: lumaTheme.spacing.md,
    minHeight: 48,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: lumaTheme.fontSize.md,
    color: lumaTheme.colors.text,
    paddingVertical: lumaTheme.spacing.sm,
  },
  attachButton: {
    padding: lumaTheme.spacing.xs,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: lumaTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: lumaTheme.colors.border,
  },
});
