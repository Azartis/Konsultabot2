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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

export default function SimpleChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  const languageOptions = [
    { value: 'english', label: 'English', flag: '🇺🇸' },
    { value: 'bisaya', label: 'Bisaya', flag: '🇵🇭' },
    { value: 'waray', label: 'Waray', flag: '🇵🇭' },
    { value: 'tagalog', label: 'Tagalog', flag: '🇵🇭' },
  ];

  const suggestedQuestions = [
    "What programs are available?",
    "Where is the library?",
    "How do I enroll?",
    "Campus facilities?"
  ];

  useEffect(() => {
    // Add welcome message
    const welcomeMessage = {
      id: 'welcome',
      text: `Hello! I'm KonsultaBot 🤖\n\nI'm your AI assistant for EVSU Dulag campus. I can help you with:\n\n• Campus information and programs\n• Technical support issues\n• Multi-language conversations\n• Offline assistance\n\nWhat would you like to know today?`,
      isBot: true,
      timestamp: new Date(),
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

    // Simulate typing delay
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: getResponse(messageText),
        isBot: true,
        timestamp: new Date(),
        mode: 'offline',
      };

      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      setIsTyping(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const getResponse = (message) => {
    const messageLower = message.toLowerCase();
    
    const responses = {
      english: {
        greeting: "Hello! I'm KonsultaBot 🤖 I'm here to help with EVSU Dulag information!",
        programs: "EVSU Dulag offers these programs:\n\n📚 Education:\n• Bachelor of Elementary Education\n• Bachelor of Secondary Education\n\n💼 Business:\n• Bachelor of Science in Business Administration\n\n💻 Technology:\n• Bachelor of Science in Computer Science",
        library: "📚 EVSU Dulag Library:\n\n📍 Location: Main campus building, ground floor\n⏰ Hours: Monday-Friday, 8:00 AM - 5:00 PM\n📖 Services: Books, research materials, computer access",
        facilities: "🏫 EVSU Dulag Facilities:\n\n• 📚 Library with study areas\n• 💻 Computer laboratory\n• 🏃‍♂️ Gymnasium\n• 🍽️ Cafeteria\n• 🏛️ Administrative offices\n• 📝 Registrar's office",
        technical: "🔧 Technical Support:\n\n🖨️ Printer Issues:\n• Check power and connections\n• Ensure paper and ink\n• Restart printer\n\n📶 WiFi Problems:\n• Restart device WiFi\n• Reconnect to network",
        fallback: "I can help with:\n\n🎓 Academic Programs\n📚 Library Information\n🏫 Campus Facilities\n🔧 Technical Support\n\nWhat would you like to know?"
      },
      bisaya: {
        greeting: "Kumusta! Ako si KonsultaBot 🤖 Makatabang ko sa EVSU Dulag!",
        programs: "EVSU Dulag programs:\n\n📚 Education:\n• Bachelor of Elementary Education\n• Bachelor of Secondary Education\n\n💼 Business:\n• Bachelor of Science in Business Administration\n\n💻 Technology:\n• Bachelor of Science in Computer Science",
        library: "📚 Library sa EVSU Dulag:\n\n📍 Location: Main building, ground floor\n⏰ Oras: Lunes-Biyernes, 8:00 AM - 5:00 PM\n📖 Services: Books, research, computers",
        facilities: "🏫 Facilities sa EVSU Dulag:\n\n• 📚 Library\n• 💻 Computer lab\n• 🏃‍♂️ Gymnasium\n• 🍽️ Cafeteria\n• 🏛️ Offices\n• 📝 Registrar",
        technical: "🔧 Technical Support:\n\n🖨️ Printer:\n• Check kung naka-on\n• Tan-awa ang paper ug ink\n• Restart ang printer\n\n📶 WiFi:\n• Restart WiFi sa phone",
        fallback: "Makatabang ko sa:\n\n🎓 Programs\n📚 Library\n🏫 Facilities\n🔧 Tech Support\n\nUnsa imong pangutana?"
      },
      waray: {
        greeting: "Maupay nga adlaw! Ako si KonsultaBot 🤖 Makakabulig ako ha EVSU Dulag!",
        programs: "EVSU Dulag programs:\n\n📚 Education:\n• Bachelor of Elementary Education\n• Bachelor of Secondary Education\n\n💼 Business:\n• Bachelor of Science in Business Administration\n\n💻 Technology:\n• Bachelor of Science in Computer Science",
        library: "📚 Library han EVSU Dulag:\n\n📍 Location: Main building, ground floor\n⏰ Oras: Lunes-Biyernes, 8:00 AM - 5:00 PM\n📖 Services: Books, research, computers",
        facilities: "🏫 Facilities han EVSU Dulag:\n\n• 📚 Library\n• 💻 Computer lab\n• 🏃‍♂️ Gymnasium\n• 🍽️ Cafeteria\n• 🏛️ Offices\n• 📝 Registrar",
        technical: "🔧 Technical Support:\n\n🖨️ Printer:\n• Check kun naka-on\n• Kitaa an paper ngan ink\n• Restart an printer\n\n📶 WiFi:\n• Restart an WiFi",
        fallback: "Makakabulig ako ha:\n\n🎓 Programs\n📚 Library\n🏫 Facilities\n🔧 Tech Support\n\nAno an imo pangkot?"
      },
      tagalog: {
        greeting: "Kumusta! Ako si KonsultaBot 🤖 Makakatulong ako sa EVSU Dulag!",
        programs: "EVSU Dulag programs:\n\n📚 Education:\n• Bachelor of Elementary Education\n• Bachelor of Secondary Education\n\n💼 Business:\n• Bachelor of Science in Business Administration\n\n💻 Technology:\n• Bachelor of Science in Computer Science",
        library: "📚 Library ng EVSU Dulag:\n\n📍 Location: Main building, ground floor\n⏰ Oras: Lunes-Biyernes, 8:00 AM - 5:00 PM\n📖 Services: Books, research, computers",
        facilities: "🏫 Facilities ng EVSU Dulag:\n\n• 📚 Library\n• 💻 Computer lab\n• 🏃‍♂️ Gymnasium\n• 🍽️ Cafeteria\n• 🏛️ Offices\n• 📝 Registrar",
        technical: "🔧 Technical Support:\n\n🖨️ Printer:\n• Check kung naka-on\n• Tingnan ang paper at ink\n• Restart ang printer\n\n📶 WiFi:\n• Restart ang WiFi",
        fallback: "Makakatulong ako sa:\n\n🎓 Programs\n📚 Library\n🏫 Facilities\n🔧 Tech Support\n\nAno ang tanong mo?"
      }
    };

    const langResponses = responses[language] || responses.english;

    // Determine appropriate response
    if (messageLower.includes('hello') || messageLower.includes('hi') || 
        messageLower.includes('kumusta') || messageLower.includes('maupay')) {
      return langResponses.greeting;
    }
    
    if (messageLower.includes('program') || messageLower.includes('course') || 
        messageLower.includes('kurso') || messageLower.includes('degree')) {
      return langResponses.programs;
    }
    
    if (messageLower.includes('library') || messageLower.includes('libro')) {
      return langResponses.library;
    }
    
    if (messageLower.includes('facility') || messageLower.includes('facilities') ||
        messageLower.includes('building') || messageLower.includes('campus')) {
      return langResponses.facilities;
    }
    
    if (messageLower.includes('printer') || messageLower.includes('computer') ||
        messageLower.includes('wifi') || messageLower.includes('technical') ||
        messageLower.includes('problema') || messageLower.includes('problem')) {
      return langResponses.technical;
    }

    return langResponses.fallback;
  };

  const speakMessage = (text) => {
    Speech.speak(text, {
      language: language === 'english' ? 'en' : 'fil',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const renderMessage = (message, index) => {
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
          
          {message.mode && (
            <Text style={styles.modeIndicator}>
              {message.mode === 'offline' ? '🔌 Offline' : '🌐 Online'}
            </Text>
          )}
        </View>

        {message.isBot && (
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
              {isTyping ? 'Typing...' : 'EVSU Dulag AI Assistant'}
            </Text>
          </View>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageText}>
              {languageOptions.find(l => l.value === language)?.flag} {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
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
        
        {/* Loading indicator */}
        {isTyping && (
          <View style={styles.messageContainer}>
            <View style={styles.botAvatar}>
              <Text style={styles.avatarText}>🤖</Text>
            </View>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <Text style={styles.typingText}>KonsultaBot is typing...</Text>
            </View>
          </View>
        )}
        
        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => sendMessage(question)}
              >
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
            placeholder="Ask me anything about EVSU Dulag..."
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
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? "#fff" : "#999"} 
            />
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
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1976d2',
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
