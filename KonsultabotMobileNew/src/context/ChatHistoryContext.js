import React, { createContext, useState, useContext, useEffect } from 'react';
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
        setChats(parsedChats);
        
        // Set most recent chat as current if none selected
        if (!currentChatId && parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const saveChats = async () => {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setChats(prevChats => [newChat, ...prevChats]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const updateChatMessages = (chatId, messages) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          // Auto-generate title from first message if still "New Chat"
          let title = chat.title;
          if (title === 'New Chat' && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.sender === 'user');
            if (firstUserMsg) {
              title = firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
            }
          }
          
          return {
            ...chat,
            messages,
            title,
            updatedAt: new Date().toISOString(),
          };
        }
        return chat;
      })
    );
  };

  const deleteChat = (chatId) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const getChatById = (chatId) => {
    return chats.find(chat => chat.id === chatId);
  };

  const getCurrentChat = () => {
    return getChatById(currentChatId);
  };

  const clearAllChats = async () => {
    setChats([]);
    setCurrentChatId(null);
    await AsyncStorage.removeItem('chat_history');
  };

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
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
};
