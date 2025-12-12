import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text, Button, LogBox } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatHistoryProvider } from './src/context/ChatHistoryContext';
import MainNavigator from './src/navigation/MainNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lumaTheme } from './src/theme/lumaTheme';
import WelcomeScreen from './src/screens/WelcomeScreen';

const Stack = createStackNavigator();

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'AsyncStorage has been extracted from react-native core',
]);

// Error Boundary Component
function NavigationWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lumaTheme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: lumaTheme.colors.background },
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main App Stack
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'An unknown error occurred'}
          </Text>
          {__DEV__ && this.state.errorInfo && (
            <Text style={styles.errorDetails}>
              {this.state.errorInfo.componentStack?.split('\n').slice(0, 5).join('\n')}
            </Text>
          )}
          <Button title="Try Again" onPress={this.handleRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}

// Root component that handles authentication state
function Root() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading KonsultaBot...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is logged in - show main app
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        // User is not logged in - show auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Main App Component
export default function App() {
  const [isReady, setIsReady] = React.useState(false);
  const [initError, setInitError] = React.useState(null);

  React.useEffect(() => {
      // Initialize app with better error handling
      const init = async () => {
        try {
          console.log('🚀 App initializing...');
          
          // Test critical imports
          if (!lumaTheme) {
            throw new Error('lumaTheme not found');
          }
          
          // Small delay to ensure everything is loaded
          await new Promise(resolve => setTimeout(resolve, 200));
          
          setIsReady(true);
          console.log('✅ App ready!');
        } catch (error) {
          console.error('❌ App initialization error:', error);
          setInitError(error.message);
          setIsReady(true); // Still show app even if init fails
        }
      };

      // Reduced timeout for Android emulator (3 seconds instead of 5)
      const timeout = setTimeout(() => {
        if (!isReady) {
          console.warn('⚠️ App initialization timeout, forcing ready state');
          setIsReady(true);
        }
      }, 3000);

      init();

      return () => clearTimeout(timeout);
    }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading KonsultaBot...</Text>
        <Text style={styles.loadingSubtext}>Please wait...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
        <Text style={styles.errorDetails}>Please restart the app</Text>
      </View>
    );
  }

  try {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <PaperProvider theme={lumaTheme}>
            <AuthProvider>
              <ChatHistoryProvider>
                <NavigationContainer
                  onReady={() => console.log('✅ Navigation ready')}
                  onStateChange={() => {}}
                >
                  <StatusBar style="light" />
                  <NavigationWrapper />
                </NavigationContainer>
              </ChatHistoryProvider>
            </AuthProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ Render error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Render Error</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Text style={styles.errorDetails}>Check console for details</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  responsiveWrapper: {
    flex: 1,
    backgroundColor: lumaTheme.colors.background,
    alignItems: 'center',
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: lumaTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lumaTheme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 12,
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#EF4444',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#6B7280',
  },
  errorDetails: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
});