import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { lumaTheme } from '../../theme/lumaTheme';
import HolographicOrb from '../../components/HolographicOrb';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Validate email format
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const result = await login(email.toLowerCase().trim(), password);
      
      if (!result.success) {
        setError(result.error || 'Invalid credentials. Please check your email and password.');
      }
      // If success, navigation is handled by AuthContext
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#000000', '#0A0A0A']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={24} color={lumaTheme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>KonsultaBot</Text>
            </View>

            {/* Holographic Orb */}
            <View style={styles.orbContainer}>
              <HolographicOrb size={80} animate={true} />
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your AI conversations
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="email" size={20} color={lumaTheme.colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={lumaTheme.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <MaterialIcons name="lock" size={20} color={lumaTheme.colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={lumaTheme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={lumaTheme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error-outline" size={16} color={lumaTheme.colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Backend Connection Info */}
              {loading && (
                <View style={styles.infoContainer}>
                  <MaterialIcons name="info-outline" size={16} color={lumaTheme.colors.primary} />
                  <Text style={styles.infoText}>Connecting to server...</Text>
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={lumaTheme.gradients.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={lumaTheme.colors.text} />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signupLink}>Create account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: lumaTheme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 40 : lumaTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: lumaTheme.spacing.md,
  },
  orbContainer: {
    alignItems: 'center',
    marginVertical: lumaTheme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: lumaTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: lumaTheme.spacing.md,
  },
  headerTitle: {
    fontSize: lumaTheme.fontSize.lg,
    fontWeight: lumaTheme.fontWeight.semibold,
    color: lumaTheme.colors.text,
  },
  titleContainer: {
    marginBottom: lumaTheme.spacing.md,
  },
  title: {
    fontSize: lumaTheme.fontSize.xxl,
    fontWeight: lumaTheme.fontWeight.bold,
    color: lumaTheme.colors.text,
    marginBottom: lumaTheme.spacing.xs,
  },
  subtitle: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lumaTheme.colors.surface,
    borderRadius: lumaTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: lumaTheme.colors.border,
    marginBottom: lumaTheme.spacing.sm,
    height: 48,
    paddingHorizontal: lumaTheme.spacing.md,
  },
  inputIconContainer: {
    marginRight: lumaTheme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: lumaTheme.fontSize.md,
    color: lumaTheme.colors.text,
  },
  eyeIcon: {
    padding: lumaTheme.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: lumaTheme.borderRadius.sm,
    padding: lumaTheme.spacing.sm,
    marginBottom: lumaTheme.spacing.md,
  },
  errorText: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.error,
    marginLeft: lumaTheme.spacing.sm,
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: lumaTheme.borderRadius.sm,
    padding: lumaTheme.spacing.sm,
    marginBottom: lumaTheme.spacing.md,
  },
  infoText: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.primary,
    marginLeft: lumaTheme.spacing.sm,
  },
  loginButton: {
    height: 48,
    borderRadius: lumaTheme.borderRadius.xl,
    overflow: 'hidden',
    marginTop: lumaTheme.spacing.md,
    ...lumaTheme.shadows.medium,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: lumaTheme.fontSize.lg,
    fontWeight: lumaTheme.fontWeight.semibold,
    color: lumaTheme.colors.text,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: lumaTheme.spacing.md,
    marginBottom: lumaTheme.spacing.sm,
  },
  signupText: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.textSecondary,
  },
  signupLink: {
    fontSize: lumaTheme.fontSize.md,
    color: lumaTheme.colors.primary,
    fontWeight: lumaTheme.fontWeight.semibold,
  },
});
