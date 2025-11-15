import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { lumaTheme } from '../../theme/lumaTheme';
import HolographicOrb from '../../components/HolographicOrb';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    student_id: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    course: '',
    year_level: '',
  });
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  
  // Validate that we have access to the auth context
  if (!auth || typeof auth.register !== 'function') {
    console.error('Auth context not properly initialized:', auth);
    Alert.alert(
      'Error',
      'Authentication system not initialized. Please try again or contact support.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
    return null;
  }
  
  const { register } = auth;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { student_id, email, password, password_confirm, first_name, last_name } = formData;
    
    if (!student_id || !email || !password || !password_confirm || !first_name || !last_name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== password_confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    if (!email.toLowerCase().includes('@evsu.edu.ph') && !email.toLowerCase().includes('@student.evsu.edu.ph')) {
      Alert.alert('Error', 'Please use your EVSU email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
    const result = await register(formData);

    if (result.success) {
      Alert.alert(
        'Success', 
          result.message || 'Registration successful! Welcome to KonsultaBot.',
        [
          {
            text: 'OK',
            onPress: () => {
              // User is automatically logged in after registration
              // Navigation will be handled by the AuthContext
            }
          }
        ]
      );
    } else {
        Alert.alert('Registration Failed', result.error || 'Please check your information and try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
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
            <Text style={styles.appTitle}>Student Registration</Text>
            <Text style={styles.subtitle}>Create your account to get started</Text>
          </View>

          <View style={styles.formCard}>
              
            {/* Student ID Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="badge" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="Student ID *"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.student_id}
                onChangeText={(value) => updateField('student_id', value)}
                style={styles.input}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="EVSU Email *"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="Password *"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="Confirm Password *"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.password_confirm}
                onChangeText={(value) => updateField('password_confirm', value)}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {/* First Name Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="First Name *"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.first_name}
                onChangeText={(value) => updateField('first_name', value)}
                style={styles.input}
              />
            </View>

            {/* Last Name Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="person-outline" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="Last Name *"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.last_name}
                onChangeText={(value) => updateField('last_name', value)}
                style={styles.input}
              />
            </View>

            {/* Course Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="school" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="Course (Optional)"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.course}
                onChangeText={(value) => updateField('course', value)}
                style={styles.input}
              />
            </View>

            {/* Year Level Input */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="calendar-today" size={20} color={lumaTheme.colors.primary} style={styles.inputIcon} />
              <TextInput
                placeholder="Year Level (Optional)"
                placeholderTextColor={lumaTheme.colors.textMuted}
                value={formData.year_level}
                onChangeText={(value) => updateField('year_level', value)}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={lumaTheme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButton}
              >
                {loading ? (
                  <Text style={styles.buttonText}>Creating Account...</Text>
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lumaTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: lumaTheme.spacing.lg,
    paddingTop: lumaTheme.spacing.md,
    paddingBottom: 200,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: lumaTheme.spacing.md,
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
  orbContainer: {
    alignItems: 'center',
    marginVertical: lumaTheme.spacing.md,
  },
  titleContainer: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    marginBottom: lumaTheme.spacing.md,
  },
  appTitle: {
    fontSize: lumaTheme.fontSize.xl,
    fontWeight: lumaTheme.fontWeight.bold,
    color: lumaTheme.colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: lumaTheme.fontSize.sm,
    color: lumaTheme.colors.textSecondary,
    marginTop: lumaTheme.spacing.xs,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: lumaTheme.colors.surface,
    borderRadius: lumaTheme.borderRadius.xl,
    padding: lumaTheme.spacing.xl,
    ...lumaTheme.shadows.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lumaTheme.colors.inputBackground,
    borderRadius: lumaTheme.borderRadius.lg,
    paddingHorizontal: lumaTheme.spacing.md,
    marginBottom: lumaTheme.spacing.md,
    borderWidth: 1,
    borderColor: lumaTheme.colors.border,
  },
  inputIcon: {
    marginRight: lumaTheme.spacing.sm,
  },
  input: {
    flex: 1,
    color: lumaTheme.colors.text,
    fontSize: lumaTheme.fontSize.md,
    paddingVertical: lumaTheme.spacing.md,
  },
  registerButton: {
    borderRadius: lumaTheme.borderRadius.lg,
    paddingVertical: lumaTheme.spacing.md,
    alignItems: 'center',
    marginTop: lumaTheme.spacing.lg,
    ...lumaTheme.shadows.glow,
  },
  buttonText: {
    color: lumaTheme.colors.text,
    fontSize: lumaTheme.fontSize.md,
    fontWeight: lumaTheme.fontWeight.bold,
  },
  loginLink: {
    marginTop: lumaTheme.spacing.lg,
    alignItems: 'center',
  },
  loginLinkText: {
    color: lumaTheme.colors.textSecondary,
    fontSize: lumaTheme.fontSize.md,
  },
  loginLinkBold: {
    color: lumaTheme.colors.primary,
    fontWeight: lumaTheme.fontWeight.bold,
  },
});
