import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text, Button, LogBox } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import MainNavigator from './src/navigation/MainNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'AsyncStorage has been extracted from react-native core',
]);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || 'An unknown error occurred'}
          </Text>
          <Button title="Try Again" onPress={this.handleRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}

// Root component that handles authentication state
function Root() {
  const { checkAuth } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, [checkAuth]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Authentication Error</Text>
        <Text style={styles.errorText}>{error.message || 'Failed to initialize app'}</Text>
        <Button
          title="Retry"
          onPress={() => {
            setError(null);
            checkAuth().catch(err => setError(err));
          }}
        />
      </View>
    );
  }

  return <MainNavigator />;
}

// Main App Component
export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Root />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ff3b30',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
});