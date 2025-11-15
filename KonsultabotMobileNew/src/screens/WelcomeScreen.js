import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import HolographicOrb from '../components/HolographicOrb';
import { lumaTheme } from '../theme/lumaTheme';

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
    <LinearGradient
      colors={['#000000', '#0A0A0A', '#000000']}
      style={styles.container}
    >
      {/* Orb with Text Overlay */}
      <Animated.View
        style={[
          styles.orbSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Holographic Orb */}
        <View style={styles.orbWrapper}>
          <HolographicOrb size={Math.min(width * 0.85, 400)} animate={true} />
          
          {/* Text Overlaid on Orb */}
          <View style={styles.orbTextContainer}>
            <Text style={styles.orbTitle}>KonsultaBot</Text>
            <Text style={styles.orbTitle}>Your Smart Chat</Text>
            <Text style={styles.orbTitle}>Buddy, Always</Text>
            <Text style={styles.orbTitle}>Here to Help</Text>
            
            <Text style={styles.orbSubtitle}>
              From quick answers to deep conversations, everything you need is just one message away.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Content */}
      <Animated.View
        style={[
          styles.bottomContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >

        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={lumaTheme.gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>


          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lumaTheme.colors.background,
  },
  orbSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  orbWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: Math.min(width * 0.85, 400),
    height: Math.min(width * 0.85, 400),
  },
  orbTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: lumaTheme.spacing.xl,
  },
  orbTitle: {
    fontSize: lumaTheme.fontSize.xxl,
    fontWeight: lumaTheme.fontWeight.bold,
    color: lumaTheme.colors.text,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  orbSubtitle: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.text,
    textAlign: 'center',
    marginTop: lumaTheme.spacing.md,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    opacity: 0.9,
  },
  bottomContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: lumaTheme.spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? lumaTheme.spacing.xxl : lumaTheme.spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: lumaTheme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: lumaTheme.colors.border,
  },
  dotActive: {
    backgroundColor: lumaTheme.colors.primary,
    width: 24,
  },
  buttonsContainer: {
    marginTop: lumaTheme.spacing.xl,
  },
  primaryButton: {
    height: 56,
    borderRadius: lumaTheme.borderRadius.xl,
    overflow: 'hidden',
    ...lumaTheme.shadows.medium,
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: lumaTheme.fontSize.lg,
    fontWeight: lumaTheme.fontWeight.semibold,
    color: lumaTheme.colors.text,
  },
  googleButton: {
    height: 56,
    borderRadius: lumaTheme.borderRadius.xl,
    backgroundColor: lumaTheme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: lumaTheme.colors.border,
  },
  googleButtonText: {
    fontSize: lumaTheme.fontSize.lg,
    fontWeight: lumaTheme.fontWeight.medium,
    color: lumaTheme.colors.text,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: lumaTheme.spacing.sm,
  },
  signupText: {
    fontSize: lumaTheme.fontSize.md,
    color: lumaTheme.colors.textSecondary,
  },
  signupLink: {
    fontSize: lumaTheme.fontSize.md,
    color: lumaTheme.colors.primary,
    fontWeight: lumaTheme.fontWeight.semibold,
  },
});
