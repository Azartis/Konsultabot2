import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import chatService from '../services/chatService';

const ChatScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(true);
  const scrollViewRef = useRef();
  const [audioRecording, setAudioRecording] = useState();
  const [currentMode, setCurrentMode] = useState('chat'); // 'chat', 'translation', 'image-gen'

  useEffect(() => {
    // Load chat history
    loadHistory();
    // Request audio permissions
    Audio.requestPermissionsAsync();
    return () => {
      // Clean up
      if (audioRecording) {
        audioRecording.unloadAsync();
      }
    };
  }, []);

  const loadHistory = async () => {
    const history = await chatService.getHistory();
    if (history.length > 0) {
      const formattedMessages = history.map(item => ({
        id: item.id || Date.now(),
        text: item.message,
        response: item.response,
        isUser: true,
        timestamp: new Date(item.timestamp)
      }));
      setMessages(formattedMessages);
    }
  };

  const handleSend = async () => {
    if (message.trim()) {
      const userMessage = {
        id: Date.now(),
        text: message,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentMessage = message;
      setMessage('');
      setLoading(true);

      try {
        const response = await chatService.sendMessage(currentMessage);
        
        if (response.success) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: response.text,
            isUser: false,
            timestamp: new Date(),
            mode: response.mode
          }]);
        } else {
          Alert.alert('Error', 'Failed to get response from the bot');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
      } finally {
        setLoading(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setAudioRecording(recording);
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!audioRecording) return;

    try {
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();
      setRecording(false);
      
      // Here you would normally send the audio file to your speech-to-text service
      // For now, we'll just show a message
      setMessage('Audio recording completed. Speech-to-text conversion would happen here.');
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>KonsultaBot</Text>
          <Text style={styles.subtitle}>Your Smart AI Companion</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.isUser ? styles.userMessageWrapper : styles.botMessageWrapper,
            ]}
          >
            {!msg.isUser && (
              <View style={styles.botAvatar}>
                <Icon name="logo-electron" size={24} color="#007AFF" />
              </View>
            )}
            <View
              style={[
                styles.message,
                msg.isUser ? styles.userMessage : styles.botMessage,
              ]}
            >
              <Text style={msg.isUser ? styles.userMessageText : styles.botMessageText}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Quick Access History */}
      <ScrollView horizontal style={styles.quickAccess} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.quickAccessItem}>
          <Icon name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.quickAccessText}>Daily task planner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAccessItem}>
          <Icon name="help-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.quickAccessText}>Recent questions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAccessItem}>
          <Icon name="document-text-outline" size={20} color="#007AFF" />
          <Text style={styles.quickAccessText}>Knowledge base</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Input Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TouchableOpacity style={styles.attachButton}>
          <Icon name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={styles.micButton}
          onPress={toggleRecording}
        >
          <Icon
            name={recording ? "stop-circle" : "mic"}
            size={24}
            color={recording ? "#FF3B30" : "#007AFF"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, message.trim() ? styles.sendButtonActive : null]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Icon name="send" size={24} color={message.trim() ? "#fff" : "#A0A0A0"} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  settingsButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  botMessageWrapper: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  message: {
    padding: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#007AFF',
  },
  botMessage: {
    backgroundColor: '#1C1C1E',
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#fff',
  },
  quickAccess: {
    backgroundColor: '#1C1C1E',
    padding: 12,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  quickAccessText: {
    color: '#fff',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    color: '#fff',
    maxHeight: 100,
  },
  micButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    opacity: 0.5,
  },
  sendButtonActive: {
    backgroundColor: '#007AFF',
    opacity: 1,
  },
});

export default ChatScreen;