import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HolographicOrb from '../components/HolographicOrb';
import GlitchText from '../components/GlitchText';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <GlitchText style={styles.headerTitle}>Konsultabot</GlitchText>
        </View>

        {/* Orb Section */}
        <View style={styles.orbSection}>
          <HolographicOrb size={Math.min(width * 0.35, 180)} animate={true} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSubtitle}>
            Your AI assistant for quick answers and deep conversations
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#202124',
    letterSpacing: 1,
  },
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '400',
    color: '#1A73E8',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#5F6368',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#4285F4',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    color: '#5F6368',
  },
  signupLink: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
  },
});
