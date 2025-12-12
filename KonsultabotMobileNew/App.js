import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ChatHistoryProvider } from './src/context/ChatHistoryContext';
import ImprovedChatScreen from './src/screens/main/ImprovedChatScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ChatHistoryProvider>
            <StatusBar style="auto" />
            <ImprovedChatScreen navigation={null} />
          </ChatHistoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

