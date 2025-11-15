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

const { width } = Dimensions.get('window');

export default function MinimalKonsultaBot() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    // Welcome message
    const welcomeMessage = {
      id: 'welcome',
      text: `Hello! I'm KonsultaBot 🤖\n\nI'm your IT assistant for EVSU Dulag Campus. I can help you with:\n\n• Computer problems\n• WiFi issues\n• Printer troubleshooting\n• Software help\n\nWhat IT issue can I help you with?`,
      isBot: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setLoading(true);

    // Simulate processing delay
    setTimeout(() => {
      const botResponse = getITResponse(currentInput);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
        mode: 'offline'
      };

      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const getITResponse = (message) => {
    const messageLower = message.toLowerCase();
    
    // Computer issues
    if (messageLower.includes('computer') || messageLower.includes('laptop') || messageLower.includes('pc')) {
      return `🖥️ **Computer Troubleshooting**\n\nI can help with your computer issue! Let me guide you:\n\n🔍 **Tell me more:**\n• What exactly happens when you try to use it?\n• Any error messages?\n• When did this start?\n\n💡 **Quick fixes to try:**\n1. Restart your computer\n2. Check all cable connections\n3. Make sure power is connected\n4. Try safe mode if it won't start normally\n\nWhat specific computer problem are you experiencing?`;
    }
    
    // WiFi issues
    if (messageLower.includes('wifi') || messageLower.includes('internet') || messageLower.includes('network')) {
      return `📶 **WiFi Troubleshooting**\n\nLet's fix your WiFi connection:\n\n🔍 **What's happening:**\n• Can't see WiFi networks?\n• Connects but no internet?\n• Very slow connection?\n• Keeps disconnecting?\n\n🛠️ **Try these steps:**\n1. Turn WiFi off and on again\n2. Restart your router (unplug 30 seconds)\n3. Forget and reconnect to WiFi\n4. Check if others have the same issue\n5. Move closer to the router\n\nWhich WiFi problem are you having?`;
    }
    
    // Printer issues
    if (messageLower.includes('printer') || messageLower.includes('print')) {
      return `🖨️ **Printer Troubleshooting**\n\nPrinter problems are common! Let's solve it:\n\n🔍 **What's wrong:**\n• Won't turn on?\n• Computer can't find it?\n• Prints blank pages?\n• Paper jams?\n• Poor print quality?\n\n🛠️ **Basic fixes:**\n1. Check power and USB connections\n2. Restart printer (off 30 seconds, then on)\n3. Check paper and ink/toner levels\n4. Clear any paper jams\n5. Update printer drivers\n6. Set as default printer\n\nWhat exactly is your printer doing (or not doing)?`;
    }
    
    // Software issues
    if (messageLower.includes('software') || messageLower.includes('program') || messageLower.includes('app') || messageLower.includes('install')) {
      return `💻 **Software Troubleshooting**\n\nSoftware issues can be tricky! Let's fix it:\n\n🔍 **What's happening:**\n• Won't install?\n• Crashes when opening?\n• Runs very slowly?\n• Missing features?\n• Error messages?\n\n🛠️ **Common solutions:**\n1. Run as administrator (right-click → Run as admin)\n2. Check for software updates\n3. Restart your computer\n4. Disable antivirus temporarily\n5. Check system requirements\n6. Reinstall the software\n\nWhich software is giving you trouble, and what exactly happens?`;
    }
    
    // Email issues
    if (messageLower.includes('email') || messageLower.includes('outlook') || messageLower.includes('gmail')) {
      return `📧 **Email Troubleshooting**\n\nEmail problems can be frustrating! Let's fix it:\n\n🔍 **What's the issue:**\n• Can't send emails?\n• Not receiving emails?\n• Can't log in?\n• Emails going to spam?\n• Slow to load?\n\n🛠️ **Try these fixes:**\n1. Check internet connection\n2. Verify email settings (SMTP/IMAP)\n3. Check spam/junk folders\n4. Clear browser cache\n5. Try different browser/app\n6. Check email storage space\n\nWhat specific email problem are you experiencing?`;
    }
    
    // Password issues
    if (messageLower.includes('password') || messageLower.includes('login') || messageLower.includes('forgot')) {
      return `🔐 **Password & Login Help**\n\nLogin troubles? I can guide you:\n\n🔍 **What's happening:**\n• Forgot your password?\n• Account locked?\n• Password not working?\n• Two-factor authentication issues?\n\n🛠️ **Solutions:**\n1. Use "Forgot Password" link\n2. Check caps lock is off\n3. Try typing password in notepad first\n4. Clear browser saved passwords\n5. Contact IT support for account unlock\n6. Check if account needs reactivation\n\nWhich account or system are you trying to access?`;
    }
    
    // Slow performance
    if (messageLower.includes('slow') || messageLower.includes('freeze') || messageLower.includes('lag')) {
      return `⚡ **Performance Issues**\n\nSlow computer? Let's speed it up:\n\n🔍 **What's slow:**\n• Startup?\n• Opening programs?\n• Internet browsing?\n• Everything in general?\n\n🛠️ **Speed up steps:**\n1. Restart your computer\n2. Close unnecessary programs\n3. Check available storage space\n4. Run disk cleanup\n5. Check for malware\n6. Update your system\n7. Disable startup programs\n\nWhen did you first notice the slowness?`;
    }
    
    // General greeting
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('help')) {
      return `👋 **Hello! I'm here to help with IT issues!**\n\nI specialize in helping EVSU Dulag students and faculty with:\n\n💻 **Computer Problems:**\n• Won't start, slow, freezing, errors\n\n📶 **Network Issues:**\n• WiFi, internet, connection problems\n\n🖨️ **Printer Troubles:**\n• Won't print, poor quality, paper jams\n\n💾 **Software Help:**\n• Installation, crashes, updates\n\n📧 **Email & Login:**\n• Password resets, account access\n\nWhat IT problem can I help you solve today?`;
    }
    
    // Default IT guidance
    return `🤖 **I'm your IT support assistant!**\n\nI can help with your IT issue. To give you the best guidance, please tell me:\n\n🔍 **Details I need:**\n• What device/software has the problem?\n• What exactly happens?\n• When did this start?\n• Any error messages?\n• What have you tried already?\n\n💡 **I'm great at helping with:**\n• Computer and laptop issues\n• WiFi and internet problems\n• Printer troubleshooting\n• Software installation and errors\n• Email and login problems\n• Performance and speed issues\n\nDescribe your IT problem and I'll walk you through the solution step by step!`;
  };

  const renderMessage = (message) => {
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
              🔌 IT Support Mode
            </Text>
          )}
        </View>

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
              EVSU Dulag IT Assistant
            </Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
            <Text style={styles.statusText}>Ready</Text>
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
        {messages.map(renderMessage)}
        
        {loading && (
          <View style={styles.messageContainer}>
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
            onPress={sendMessage}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <ActivityIndicator size={20} color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>
                {inputText.trim() ? '➤' : '○'}
              </Text>
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
  sendButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
