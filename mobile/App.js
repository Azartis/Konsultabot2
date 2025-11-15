import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ChatScreen from './src/screens/ChatScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    // TODO: Navigate to the chat screen
  };

  const handleRegisterSuccess = () => {
    setShowRegister(false); // Show login screen after successful registration
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        {showRegister ? (
          <RegisterScreen
            onRegisterSuccess={handleRegisterSuccess}
            onLoginPress={() => setShowRegister(false)}
          />
        ) : (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onRegisterPress={() => setShowRegister(true)}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ChatScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
