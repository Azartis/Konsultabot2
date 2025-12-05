import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatHistoryContext = createContext();

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within ChatHistoryProvider');
  }
  return context;
};

export const ChatHistoryProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Load chats from storage on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Save chats whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      saveChats();
    }
  }, [chats]);

  const loadChats = async () => {
    try {
      const storedChats = await AsyncStorage.getItem('chat_history');
      if (storedChats) {
        const parsedChats = JSON.parse(storedChats);
        // Filter out any temporary chats (shouldn't be in storage, but just in case)
        const permanentChats = parsedChats.filter(chat => !chat.temporary);
        setChats(permanentChats);
        
        // Set most recent chat as current if none selected
        if (!currentChatId && permanentChats.length > 0) {
          setCurrentChatId(permanentChats[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const saveChats = async () => {
    try {
      // Only save chats that are not temporary (have user messages)
      const chatsToSave = chats.filter(chat => !chat.temporary);
      await AsyncStorage.setItem('chat_history', JSON.stringify(chatsToSave));
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
    await AsyncStorage.removeItem('chat_history');
  }, []);

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
