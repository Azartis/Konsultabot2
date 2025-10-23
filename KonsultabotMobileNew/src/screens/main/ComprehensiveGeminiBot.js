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
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiService } from '../../services/apiService';
import { theme } from '../../theme/cleanTheme';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function ComprehensiveGeminiBot() {
  const { logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userData, setUserData] = useState(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    initializeChat();
    setupAudio();
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.warn('Audio setup failed:', error);
    }
  };

  const initializeChat = async () => {
    try {
      // Load user data
      const userDataString = await AsyncStorage.getItem('user_data');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      }
      
      const welcomeMessage = {
        id: Date.now(),
        text: "Hello! I'm KonsultaBot with Gemini AI integration! 🤖✨\n\nI can help you with:\n• IT support and technical issues (powered by Gemini AI)\n• Academic questions and study tips\n• Fun conversations and jokes\n• Voice interactions 🎤\n• Silly or random questions\n• Creative discussions\n• EVSU campus information\n\nYou can type your question or use the microphone to speak! What would you like to chat about today?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'welcome'
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Chat initialization error:', error);
    }
  };

  const sendMessage = async (messageText = null) => {
    const text = messageText || inputText.trim();
    if (!text) return;

    const userMessage = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Try Gemini API first
      let response;
      let responseSource = 'gemini';
      
      try {
        console.log('🤖 Trying Gemini API...');
        response = await apiService.sendMessage(text);
        setIsConnected(true);
      } catch (geminiError) {
        console.log('Gemini API failed, trying comprehensive AI server...');
        
        // Try comprehensive AI server (Gemini + Knowledge Base hybrid)
        try {
          const token = await AsyncStorage.getItem('accessToken');
          if (token) {
            console.log('🌐 Calling backend server with Gemini + KB hybrid...');
            const apiResponse = await axios.post('http://192.168.1.17:8000/api/v1/chat/', {
              query: text, // Backend expects 'query' not 'message'
              language: 'english'
            }, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000
            });
            
            console.log('✅ Backend response:', apiResponse.data);
            response = {
              response: apiResponse.data.message, // Backend returns 'message' not 'response'
              confidence: apiResponse.data.confidence // Backend returns 'confidence' not 'ai_confidence'
            };
            responseSource = apiResponse.data.source || 'comprehensive_ai'; // Use actual source (gemini/knowledge_base)
          } else {
            throw new Error('No auth token');
          }
        } catch (serverError) {
          console.log('Server API failed, using local comprehensive response...');
          response = {
            response: getComprehensiveLocalResponse(text),
            confidence: 0.85
          };
          responseSource = 'local_ai';
          setIsConnected(false);
        }
      }

      // Extract response text based on structure
      let responseText = '';
      let confidence = 0.95;
      
      if (response?.data?.response) {
        // Local Gemini AI structure: { data: { response, confidence } }
        responseText = response.data.response;
        confidence = response.data.confidence || 0.95;
      } else if (response?.response) {
        // Direct structure: { response, confidence }
        responseText = response.response;
        confidence = response.confidence || 0.95;
      } else if (typeof response === 'string') {
        // Direct string response
        responseText = response;
      } else {
        // Unknown structure, try to extract text
        responseText = response?.text || response?.message || 'Response received but could not parse text';
      }

      const botMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        confidence: confidence,
        source: responseSource
      };

      setMessages(prev => [...prev, botMessage]);

      // Save to history only if we have valid text
      if (responseText && responseText !== 'Response received but could not parse text') {
        await saveToHistory(text, responseText, botMessage.source);
      }

    } catch (error) {
      console.error('All AI methods failed:', error);
      
      const fallbackMessage = {
        id: Date.now() + 1,
        text: "I'm having some technical difficulties, but I'm still here to help! 🤖 Could you try rephrasing your question? I'm designed to handle all types of questions from serious IT support to fun conversations!",
        sender: 'bot',
        timestamp: new Date(),
        source: 'fallback'
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              const result = await logout();
              if (!result.success) {
                Alert.alert('Error', 'Failed to logout');
              }
              // The AuthContext will automatically handle navigation to login screen
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const saveToHistory = async (userMessage, botResponse, source) => {
    try {
      // Validate inputs
      if (!userMessage || !botResponse) {
        console.warn('Invalid message data, skipping history save');
        return;
      }

      const historyItem = {
        id: Date.now(),
        userMessage: String(userMessage),
        botResponse: String(botResponse),
        source: source || 'unknown',
        timestamp: new Date().toISOString(),
        userId: userData?.id || 'anonymous'
      };

      // Get existing history
      const existingHistoryString = await AsyncStorage.getItem('chat_history');
      const existingHistory = existingHistoryString ? JSON.parse(existingHistoryString) : [];

      // Add new item and keep only last 100 conversations
      const updatedHistory = [...existingHistory, historyItem].slice(-100);

      // Save back to storage
      await AsyncStorage.setItem('chat_history', JSON.stringify(updatedHistory));
      
      console.log('💾 Conversation saved to history:', {
        user: String(userMessage).substring(0, 50),
        bot: String(botResponse).substring(0, 50),
        source: source || 'unknown'
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const getComprehensiveLocalResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Greetings
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
      return "Hello there! 👋 I'm KonsultaBot with Gemini AI integration! I'm here to help with anything - from serious IT questions to silly random thoughts. You can type or speak to me! What's on your mind today?";
    }
    
    // IT Support (Gemini-style response)
    if (lowerQuery.includes('computer') || lowerQuery.includes('tech') || lowerQuery.includes('it') || 
        lowerQuery.includes('password') || lowerQuery.includes('wifi') || lowerQuery.includes('internet') ||
        lowerQuery.includes('software') || lowerQuery.includes('hardware') || lowerQuery.includes('printer')) {
      return "I'd be happy to help with your tech issue! 💻 Here's my comprehensive analysis:\n\n**Immediate Solutions:**\n• Restart your device (resolves 80% of issues)\n• Check all cable connections and power sources\n• Update software to the latest version\n• Clear browser cache and temporary files\n\n**Advanced Troubleshooting:**\n• Run system diagnostics\n• Check for conflicting software\n• Verify network connectivity\n• Contact EVSU IT support for hardware issues\n\nWhat specific symptoms are you experiencing? I can provide more targeted assistance!";
    }
    
    // Academic Help (Enhanced)
    if (lowerQuery.includes('study') || lowerQuery.includes('exam') || lowerQuery.includes('academic') ||
        lowerQuery.includes('homework') || lowerQuery.includes('assignment') || lowerQuery.includes('research')) {
      return "Excellent academic question! 📚 Here's my comprehensive study strategy:\n\n**Effective Study Techniques:**\n• **Pomodoro Technique**: 25-min focused sessions\n• **Active Recall**: Test yourself regularly\n• **Spaced Repetition**: Review at increasing intervals\n• **Mind Mapping**: Visual organization of concepts\n\n**EVSU Resources:**\n• Library databases and research materials\n• Study groups and peer collaboration\n• Professor office hours for clarification\n• Computer labs for digital projects\n\n**Exam Preparation:**\n• Create comprehensive study schedules\n• Practice with past exams and quizzes\n• Form study groups with classmates\n• Use multiple learning modalities\n\nWhat subject are you focusing on? I can provide more specific guidance!";
    }
    
    // Fun/Silly Questions (Gemini-style creativity)
    if (lowerQuery.includes('joke') || lowerQuery.includes('funny') || lowerQuery.includes('silly') ||
        lowerQuery.includes('weird') || lowerQuery.includes('random') || lowerQuery.includes('nonsense')) {
      const jokes = [
        "Here's a tech joke that would make Gemini proud! 😄\n\nWhy don't programmers like nature?\nIt has too many bugs! 🐛\n\nAnd here's a bonus: Why did the AI go to therapy?\nIt had too many deep learning issues! 🤖",
        "I love silly questions! 🦄 If unicorns went to EVSU, they'd probably major in Rainbow Engineering and minor in Cloud Computing! ☁️🌈\n\nWhat other wonderfully weird thoughts are bouncing around in your creative mind?",
        "That's delightfully random! 🎭 It's like asking why clouds don't wear shoes or why computers don't get hungry! ☁️👟💻\n\nI'm here for both serious help and fun conversations - what else is tickling your curiosity?",
        "What a beautifully nonsensical question! 🌈 Like a dancing refrigerator teaching calculus to a shy tornado! 🕺❄️🌪️\n\nYour creativity is amazing - ask me anything, practical or playful!"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    // Voice/Audio related
    if (lowerQuery.includes('voice') || lowerQuery.includes('speak') || lowerQuery.includes('microphone') || lowerQuery.includes('audio')) {
      return "I love that you're interested in voice features! 🎤✨\n\nHere's what I can do:\n• **Listen**: Use the microphone button to speak to me\n• **Speak**: I can read my responses aloud\n• **Understand**: I process both text and voice input\n• **Respond**: Natural conversation in multiple ways\n\nTry tapping the microphone button and ask me anything! I'm designed to understand natural speech patterns and respond appropriately.";
    }
    
    // EVSU Specific (Enhanced)
    if (lowerQuery.includes('evsu') || lowerQuery.includes('dulag') || lowerQuery.includes('campus') ||
        lowerQuery.includes('university') || lowerQuery.includes('school')) {
      return "Great to chat with someone from EVSU Dulag! 🏫✨\n\n**Campus Excellence:**\n• Modern IT laboratories with latest technology\n• Comprehensive library with digital databases\n• High-speed internet and WiFi coverage\n• Supportive faculty and administrative staff\n• Beautiful, well-maintained campus grounds\n\n**Academic Programs:**\n• Computer Science and IT programs\n• Engineering and technical courses\n• Research opportunities and projects\n• Industry partnerships and internships\n\n**Student Services:**\n• IT support and technical assistance\n• Academic counseling and guidance\n• Student organizations and activities\n• Career development and placement\n\nEVSU Dulag is committed to academic excellence and innovation! How can I help you make the most of your campus experience?";
    }
    
    // Creative Questions (Gemini-inspired)
    if (lowerQuery.includes('creative') || lowerQuery.includes('art') || lowerQuery.includes('design') ||
        lowerQuery.includes('write') || lowerQuery.includes('inspire')) {
      return "How wonderfully creative! 🎨✨ Here's some AI-powered inspiration:\n\n**Creative Principles:**\n• **Divergent Thinking**: Explore multiple possibilities\n• **Cross-Pollination**: Combine unrelated concepts\n• **Iterative Process**: Refine through multiple versions\n• **Emotional Resonance**: Connect with feelings and experiences\n\n**Practical Techniques:**\n• Start with constraints to spark creativity\n• Use random word associations\n• Sketch ideas before refining\n• Collaborate with others for fresh perspectives\n\n**Digital Tools:**\n• Design software and creative apps\n• AI-assisted brainstorming\n• Online collaboration platforms\n• Digital portfolios and showcases\n\nWhat kind of creative project are you working on? I can provide more specific guidance and inspiration!";
    }
    
    // Very short input
    if (query.trim().length < 3) {
      return "That's quite brief! 😊 I'm your comprehensive AI assistant with Gemini integration. Whether you want to:\n\n• 💻 Get technical support\n• 📚 Discuss academic topics\n• 🎤 Try voice interactions\n• 😄 Have fun conversations\n• 🤔 Explore deep questions\n• 🎲 Ask random things\n\nI'm here for you! You can type or use the microphone - what's on your mind?";
    }
    
    // Default comprehensive response
    return `That's a fascinating question about "${query}"! 🤖✨\n\nI'm KonsultaBot with Gemini AI integration, and I'm designed to handle all kinds of inquiries! Here's what I can help with:\n\n**Technical Support** 💻\n• IT troubleshooting and solutions\n• Software and hardware guidance\n• Network and connectivity issues\n\n**Academic Assistance** 📚\n• Study strategies and techniques\n• Research and project guidance\n• EVSU-specific resources\n\n**Interactive Features** 🎤\n• Voice recognition and responses\n• Text-to-speech capabilities\n• Natural conversation flow\n\n**Creative Discussions** 🎨\n• Brainstorming and ideation\n• Problem-solving approaches\n• Fun and engaging conversations\n\nFeel free to ask me anything - I'm here to provide comprehensive, intelligent responses! You can type or use the microphone button to speak with me.`;
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Could not start voice recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // For now, show a placeholder message since speech-to-text requires additional setup
      Alert.alert(
        'Voice Message Received',
        'Voice recording completed! For now, please type your question. Full speech-to-text integration coming soon!',
        [{ text: 'OK' }]
      );
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecording(null);
    }
  };

  const speakMessage = (text) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text.replace(/[🤖✨💻📚🎤😄🎭🌈🏫🎨]/g, ''), {
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
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
          
          {message.source && (
            <Text style={[styles.sourceText, 
              message.source === 'gemini' && styles.geminiSource,
              message.source === 'comprehensive_ai' && styles.comprehensiveSource,
              message.source === 'local_ai' && styles.localSource
            ]}>
              {message.source === 'gemini' && '✨ Powered by Gemini AI'}
              {message.source === 'comprehensive_ai' && '🤖 Comprehensive AI Server'}
              {message.source === 'local_ai' && '💡 Local AI (Offline)'}
              {message.source === 'fallback' && '🔄 Fallback Response'}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {!isUser && (
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => speakMessage(message.text)}
              >
                <MaterialIcons 
                  name={isSpeaking ? "volume-off" : "volume-up"} 
                  size={16} 
                  color={theme.colors.primary} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getQuickSuggestions = () => [
    "Help with my computer 💻",
    "Study tips please 📚",
    "Tell me a joke 😄",
    "Test voice features 🎤",
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
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>KonsultaBot + Gemini AI</Text>
            <Text style={styles.headerSubtitle}>
              {userData ? `Welcome, ${userData.first_name || userData.username}!` : 'Comprehensive AI Assistant'} {!isConnected && '(Offline Mode)'}
            </Text>
            {!isConnected && (
              <View style={styles.offlineIndicator}>
                <MaterialIcons name="wifi-off" size={16} color="#EF4444" />
                <Text style={styles.offlineText}>Local AI Active</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
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
              <Text style={styles.loadingText}>
                {isConnected ? 'Gemini AI thinking...' : 'Processing locally...'}
              </Text>
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
                onPress={() => setInputText(suggestion.replace(/[💻📚😄🎤🤔🎲🏫]/g, '').trim())}
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
            placeholder="Ask me anything - I have Gemini AI + comprehensive responses! 🤖✨"
            placeholderTextColor={theme.colors.placeholder}
            multiline
            maxLength={500}
          />
          
          {/* Voice Button */}
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            <MaterialIcons 
              name={isRecording ? "stop" : "mic"} 
              size={20} 
              color={isRecording ? "#EF4444" : theme.colors.primary} 
            />
          </TouchableOpacity>
          
          {/* Send Button */}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
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
    maxWidth: width * 0.85,
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
  sourceText: {
    fontSize: 10,
    marginTop: 5,
    fontWeight: '500',
  },
  geminiSource: {
    color: '#8B5CF6',
  },
  comprehensiveSource: {
    color: '#10B981',
  },
  localSource: {
    color: '#F59E0B',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.placeholder,
  },
  speakButton: {
    padding: 5,
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
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  voiceButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
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
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
