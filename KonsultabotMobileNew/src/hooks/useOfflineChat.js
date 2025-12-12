import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOfflineChat = (chatId) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const saveMessageOffline = useCallback(async (message) => {
    try {
      const key = `offline_chat_${chatId}`;
      const existing = await AsyncStorage.getItem(key);
      const messages = existing ? JSON.parse(existing) : [];
      messages.push({
        ...message,
        timestamp: Date.now(),
        offline: true,
      });
      await AsyncStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving offline message:', error);
    }
  }, [chatId]);

  const loadOfflineMessages = useCallback(async () => {
    try {
      const key = `offline_chat_${chatId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading offline messages:', error);
      return [];
    }
  }, [chatId]);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Sync logic would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    saveMessageOffline,
    loadOfflineMessages,
    syncNow,
    isSyncing,
  };
};

