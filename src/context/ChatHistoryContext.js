import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ChatHistoryContext = createContext();

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within ChatHistoryProvider');
  }
  return context;
};

export const ChatHistoryProvider = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Get storage key based on current user ID
  const getStorageKey = useCallback(() => {
    if (!user || !user.id) {
      return 'chat_history_guest'; // Fallback for guest users
    }
    return `chat_history_${user.id}`;
  }, [user]);

  // Load chats from storage when user changes or on mount
  useEffect(() => {
    if (user?.id) {
      loadChats();
    } else {
      // Clear chats from state when user logs out (but preserve in storage)
      setChats([]);
      setCurrentChatId(null);
    }
  }, [user?.id]); // Reload when user ID changes

  // Save chats whenever they change (only if user is logged in)
  // Use a debounce to avoid too many saves
  useEffect(() => {
    if (chats.length > 0 && user?.id) {
      // Small delay to batch multiple updates
      const saveTimer = setTimeout(() => {
        saveChats();
      }, 500); // 500ms debounce
      
      return () => clearTimeout(saveTimer);
    }
  }, [chats, user?.id]);

  const loadChats = async () => {
    try {
      const storageKey = getStorageKey();
      console.log(`📂 Loading chats for user ${user?.id} from key: ${storageKey}`);
      const storedChats = await AsyncStorage.getItem(storageKey);
      if (storedChats) {
        const parsedChats = JSON.parse(storedChats);
        console.log(`✅ Loaded ${parsedChats.length} chat(s) from storage`);
        // Filter out any temporary chats (shouldn't be in storage, but just in case)
        const permanentChats = parsedChats.filter(chat => !chat.temporary);
        console.log(`✅ ${permanentChats.length} permanent chat(s) after filtering`);
        setChats(permanentChats);
        
        // Set most recent chat as current if none selected
        if (!currentChatId && permanentChats.length > 0) {
          setCurrentChatId(permanentChats[0].id);
          console.log(`✅ Set current chat to: ${permanentChats[0].id}`);
        }
      } else {
        // No chat history for this user, start fresh
        console.log(`ℹ️ No chat history found for user ${user?.id}`);
        setChats([]);
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('❌ Error loading chats:', error);
    }
  };

  const saveChats = async () => {
    try {
      if (!user?.id) {
        console.warn('Cannot save chats: No user ID');
        return;
      }
      const storageKey = getStorageKey();
      // Only save chats that are not temporary (have user messages)
      const chatsToSave = chats.filter(chat => !chat.temporary);
      
      if (chatsToSave.length > 0) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(chatsToSave));
        console.log(`💾 Saved ${chatsToSave.length} chat(s) for user ${user.id}`);
      } else {
        // If no chats to save, ensure we don't have stale data
        // But don't remove existing chats - user might have chats from previous session
        console.log('No chats to save (all temporary or empty)');
      }
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  };

  const createNewChat = useCallback((temporary = false) => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      temporary: temporary, // Mark as temporary if not saved yet
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, []);

  const updateChatMessages = useCallback((chatId, messages) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          // Check if there are any user messages (not just bot welcome messages)
          const hasUserMessages = messages.some(m => m.sender === 'user');
          
          // Auto-generate title from first message if still "New Chat"
          let title = chat.title;
          if (title === 'New Chat' && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.sender === 'user');
            if (firstUserMsg) {
              title = firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
            }
          }
          
          // If chat was temporary and now has user messages, mark it as permanent
          const isTemporary = chat.temporary && !hasUserMessages;
          
          return {
            ...chat,
            messages,
            title,
            updatedAt: new Date().toISOString(),
            temporary: isTemporary,
          };
        }
        return chat;
      })
    );
  }, []);

  const deleteChat = useCallback((chatId) => {
    setChats(prevChats => {
      const filtered = prevChats.filter(chat => chat.id !== chatId);
      if (currentChatId === chatId) {
        setCurrentChatId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [currentChatId]);

  const getChatById = useCallback((chatId) => {
    return chats.find(chat => chat.id === chatId);
  }, [chats]);

  const getCurrentChat = useCallback(() => {
    return getChatById(currentChatId);
  }, [currentChatId, getChatById]);

  const clearAllChats = useCallback(async () => {
    setChats([]);
    setCurrentChatId(null);
    const storageKey = getStorageKey();
    await AsyncStorage.removeItem(storageKey);
  }, [getStorageKey]);

  const removeTemporaryChats = useCallback(() => {
    setChats(prevChats => {
      const permanentChats = prevChats.filter(chat => !chat.temporary);
      // If current chat was temporary and removed, set to first permanent chat or null
      if (currentChatId && prevChats.find(c => c.id === currentChatId && c.temporary)) {
        setCurrentChatId(permanentChats.length > 0 ? permanentChats[0].id : null);
      }
      return permanentChats;
    });
  }, [currentChatId]);

  return (
    <ChatHistoryContext.Provider
      value={{
        chats,
        currentChatId,
        isOffline,
        setIsOffline,
        createNewChat,
        updateChatMessages,
        deleteChat,
        getChatById,
        getCurrentChat,
        setCurrentChatId,
        clearAllChats,
        removeTemporaryChats,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
};
