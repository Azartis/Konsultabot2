import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ChatHistoryProvider } from './src/context/ChatHistoryContext';
import ImprovedChatScreen from './src/screens/main/ImprovedChatScreen';
import SimpleSettingsScreen from './src/screens/main/SimpleSettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ChatHistoryProvider>
            <StatusBar style="auto" />
            <NavigationContainer>
              <Stack.Navigator 
                initialRouteName="Chat"
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen 
                  name="Chat" 
                  component={ImprovedChatScreen}
                />
                <Stack.Screen 
                  name="Settings" 
                  component={SimpleSettingsScreen}
                  options={{
                    headerShown: true,
                    title: 'Settings',
                    presentation: 'card',
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </ChatHistoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

