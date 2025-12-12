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
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import GlitchText from '../../components/GlitchText';

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#5F6368" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <GlitchText style={styles.headerTitle}>Konsultabot</GlitchText>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>Student Registration</Text>
            <Text style={styles.subtitle}>Create your account to get started</Text>
          </View>

          <View style={styles.formCard}>
              
            {/* Student ID Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Student ID *"
                placeholderTextColor="#9AA0A6"
                value={formData.student_id}
                onChangeText={(value) => updateField('student_id', value)}
                style={styles.input}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="EVSU Email *"
                placeholderTextColor="#9AA0A6"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Password *"
                placeholderTextColor="#9AA0A6"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Confirm Password *"
                placeholderTextColor="#9AA0A6"
                value={formData.password_confirm}
                onChangeText={(value) => updateField('password_confirm', value)}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {/* First Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="First Name *"
                placeholderTextColor="#9AA0A6"
                value={formData.first_name}
                onChangeText={(value) => updateField('first_name', value)}
                style={styles.input}
              />
            </View>

            {/* Last Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Last Name *"
                placeholderTextColor="#9AA0A6"
                value={formData.last_name}
                onChangeText={(value) => updateField('last_name', value)}
                style={styles.input}
              />
            </View>

            {/* Course Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Course (Optional)"
                placeholderTextColor="#9AA0A6"
                value={formData.course}
                onChangeText={(value) => updateField('course', value)}
                style={styles.input}
              />
            </View>

            {/* Year Level Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Year Level (Optional)"
                placeholderTextColor="#9AA0A6"
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
              style={styles.registerButton}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 200,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#202124',
    letterSpacing: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '400',
    color: '#1A73E8',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
    maxWidth: 480,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderRadius: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  input: {
    flex: 1,
    color: '#202124',
    fontSize: 16,
    paddingVertical: 16,
  },
  registerButton: {
    backgroundColor: '#4285F4',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#5F6368',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#4285F4',
    fontWeight: '500',
  },
});
