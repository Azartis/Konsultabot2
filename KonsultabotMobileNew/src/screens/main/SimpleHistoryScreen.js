import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/cleanTheme';

export default function SimpleHistoryScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Get storage key based on current user ID
  const getStorageKey = () => {
    if (!user || !user.id) {
      return 'chat_history_guest'; // Fallback for guest users
    }
    return `chat_history_${user.id}`;
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]); // Reload when user changes

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      
      // Load user data from AsyncStorage (fallback)
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        setUserData(JSON.parse(userDataString));
      } else if (user) {
        setUserData(user);
      }

      // Load conversation history from AsyncStorage (user-specific)
      const storageKey = getStorageKey();
      const historyString = await AsyncStorage.getItem(storageKey);
      if (historyString) {
        const history = JSON.parse(historyString);
        setConversations(history.slice(-20)); // Show last 20 conversations
      } else {
        setConversations([]); // No history for this user
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const storageKey = getStorageKey();
              await AsyncStorage.removeItem(storageKey);
              setConversations([]);
              Alert.alert('Success', 'Chat history cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        }
      ]
    );
  };

  const renderConversation = (conversation, index) => (
    <View key={index} style={styles.conversationItem}>
      <View style={styles.conversationHeader}>
        <MaterialIcons name="chat" size={20} color={theme.colors.primary} />
        <Text style={styles.conversationTime}>
          {new Date(conversation.timestamp).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.messagePreview}>
        <Text style={styles.userMessage} numberOfLines={2}>
          You: {conversation.userMessage}
        </Text>
        <Text style={styles.botMessage} numberOfLines={3}>
          Bot: {conversation.botResponse}
        </Text>
      </View>
      
      {conversation.source && (
        <Text style={[styles.sourceTag, 
          conversation.source === 'gemini' && styles.geminiTag,
          conversation.source === 'comprehensive_ai' && styles.comprehensiveTag,
          conversation.source === 'local_ai' && styles.localTag
        ]}>
          {conversation.source === 'gemini' && '✨ Gemini AI'}
          {conversation.source === 'comprehensive_ai' && '🤖 Comprehensive AI'}
          {conversation.source === 'local_ai' && '💡 Local AI'}
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading chat history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat History</Text>
        {userData && (
          <Text style={styles.userInfo}>
            {userData.first_name || userData.username} ({userData.role})
          </Text>
        )}
        {conversations.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <MaterialIcons name="delete" size={20} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="chat-bubble-outline" size={64} color={theme.colors.placeholder} />
          <Text style={styles.emptyTitle}>No Chat History</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation in the Chat tab to see your history here
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {conversations.map(renderConversation)}
        </ScrollView>
      )}
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
