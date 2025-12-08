/**
 * Hook for offline chat functionality
 * Integrates offline storage with chat screens
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import offlineChatStorage from '../services/offlineChatStorage';
import { loadChatMessages } from '../../utils/offlineKnowledgeBase';
import NetInfo from '@react-native-community/netinfo';

export const useOfflineChat = (chatId) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      
      // Auto-sync when coming back online
      if (state.isConnected && user?.id) {
        offlineChatStorage.trySync(user.id).catch(err => {
          console.log('Auto-sync on reconnect failed:', err.message);
        });
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Load offline messages
  const loadOfflineMessages = useCallback(async () => {
    if (!user?.id || !chatId) return [];

    try {
      const messages = await loadChatMessages(chatId, user.id);
      return messages.map(msg => ({
        id: msg.id,
        text: msg.isUser ? msg.message : (msg.response || msg.message),
        sender: msg.isUser ? 'user' : 'bot',
        timestamp: msg.timestamp,
        source: msg.source,
        confidence: msg.confidence,
      }));
    } catch (error) {
      console.error('Error loading offline messages:', error);
      return [];
    }
  }, [chatId, user?.id]);

  // Save message to offline storage
  const saveMessageOffline = useCallback(async (userMessage, botResponse, language = 'english') => {
    if (!user?.id || !chatId) return;

    try {
      await offlineChatStorage.saveMessage(
        chatId,
        user.id,
        userMessage,
        botResponse,
        language,
        chatId
      );
    } catch (error) {
      console.error('Error saving message offline:', error);
    }
  }, [chatId, user?.id]);

  // Perform manual sync
  const syncNow = useCallback(async (onProgress) => {
    if (!user?.id) return null;

    setIsSyncing(true);
    try {
      const result = await offlineChatStorage.performFullSync(user.id, onProgress);
      const syncTime = await offlineChatStorage.getLastSyncTime();
      setLastSyncTime(syncTime);
      return result;
    } catch (error) {
      console.error('Error syncing:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id]);

  // Check if sync is needed
  const checkSyncNeeded = useCallback(async () => {
    if (!user?.id) return false;
    return await offlineChatStorage.isSyncNeeded(user.id);
  }, [user?.id]);

  // Get last sync time
  useEffect(() => {
    const loadSyncTime = async () => {
      const time = await offlineChatStorage.getLastSyncTime();
      setLastSyncTime(time);
    };
    loadSyncTime();
  }, []);

  // Start auto-sync
  useEffect(() => {
    if (user?.id && isOnline) {
      offlineChatStorage.startAutoSync(user.id, 5); // Sync every 5 minutes
      
      return () => {
        offlineChatStorage.stopAutoSync();
      };
    }
  }, [user?.id, isOnline]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    loadOfflineMessages,
    saveMessageOffline,
    syncNow,
    checkSyncNeeded,
  };
};

