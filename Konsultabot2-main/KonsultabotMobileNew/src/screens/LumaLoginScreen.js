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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { lumaTheme } from '../theme/lumaTheme';

export default function LumaLoginScreen({ navigation }) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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

    setError('');
    const result = await login(email.toLowerCase().trim(), password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
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

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={lumaTheme.gradients.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color={lumaTheme.colors.text} />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <MaterialIcons name="mail" size={20} color={lumaTheme.colors.text} />
                <Text style={styles.socialButtonText}>Continue with Email</Text>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: lumaTheme.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : lumaTheme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: lumaTheme.spacing.xl,
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
    marginBottom: lumaTheme.spacing.xl,
  },
  title: {
    fontSize: lumaTheme.fontSize.xxxl,
    fontWeight: lumaTheme.fontWeight.bold,
    color: lumaTheme.colors.text,
    marginBottom: lumaTheme.spacing.sm,
  },
  subtitle: {
    fontSize: lumaTheme.fontSize.md,
    color: lumaTheme.colors.textSecondary,
    lineHeight: 24,
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
    marginBottom: lumaTheme.spacing.md,
    height: 56,
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
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: lumaTheme.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.primary,
    fontWeight: lumaTheme.fontWeight.medium,
  },
  loginButton: {
    height: 56,
    borderRadius: lumaTheme.borderRadius.xl,
    overflow: 'hidden',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: lumaTheme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: lumaTheme.colors.border,
  },
  dividerText: {
    marginHorizontal: lumaTheme.spacing.md,
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.textMuted,
  },
  socialButton: {
    height: 56,
    borderRadius: lumaTheme.borderRadius.xl,
    backgroundColor: lumaTheme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: lumaTheme.colors.border,
  },
  socialButtonText: {
    fontSize: lumaTheme.fontSize.md,
    fontWeight: lumaTheme.fontWeight.medium,
    color: lumaTheme.colors.text,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: lumaTheme.spacing.lg,
    marginBottom: lumaTheme.spacing.xl,
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
