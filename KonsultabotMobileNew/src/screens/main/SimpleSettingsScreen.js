import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ThemeOption = ({ label, mode, currentMode, onPress }) => (
  <TouchableOpacity style={styles.radioRow} onPress={() => onPress(mode)}>
    <View style={[styles.radioOuter, currentMode === mode && styles.radioOuterActive]}>
      {currentMode === mode && <View style={styles.radioInner} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function SimpleSettingsScreen() {
  const { changePassword, logout } = useAuth();
  const { themeMode, setThemeMode, isDark } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [status, setStatus] = useState(null);

  const handleChangePassword = async () => {
    setStatus(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatus({ type: 'error', message: 'Please fill out all fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    setChanging(true);
    const result = await changePassword(oldPassword, newPassword);
    setChanging(false);
    if (result.success) {
      setStatus({ type: 'success', message: 'Password updated.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ type: 'error', message: result.error || 'Change password failed.' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8f9fa' }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#e2e8f0' : '#1a1a1a' }]}>
          Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: isDark ? '#cbd5e1' : '#666' }]}>
          Customize your KonsultaBot experience
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#e2e8f0' : '#1a1a1a' }]}>
            Theme
          </Text>
          <ThemeOption
            label="Auto (follow system)"
            mode="system"
            currentMode={themeMode}
            onPress={setThemeMode}
          />
          <ThemeOption
            label="Light"
            mode="light"
            currentMode={themeMode}
            onPress={setThemeMode}
          />
          <ThemeOption
            label="Dark"
            mode="dark"
            currentMode={themeMode}
            onPress={setThemeMode}
          />
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#e2e8f0' : '#1a1a1a' }]}>
            Change Password
          </Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#374151' }]}>
              Current password
            </Text>
            <TextInput
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f9fafb',
                  color: isDark ? '#e2e8f0' : '#111827',
                  borderColor: isDark ? '#334155' : '#e5e7eb',
                },
              ]}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#374151' }]}>
              New password
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Enter new password"
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f9fafb',
                  color: isDark ? '#e2e8f0' : '#111827',
                  borderColor: isDark ? '#334155' : '#e5e7eb',
                },
              ]}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#374151' }]}>
              Confirm new password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f9fafb',
                  color: isDark ? '#e2e8f0' : '#111827',
                  borderColor: isDark ? '#334155' : '#e5e7eb',
                },
              ]}
            />
          </View>

          {status && (
            <Text
              style={[
                styles.statusText,
                {
                  color: status.type === 'success' ? '#16a34a' : '#dc2626',
                },
              ]}
            >
              {status.message}
            </Text>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword} disabled={changing}>
            {changing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#e2e8f0' : '#1a1a1a' }]}>
            Account
          </Text>
          <TouchableOpacity style={styles.dangerButton} onPress={logout}>
            <Text style={styles.dangerButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterActive: {
    borderColor: '#4f46e5',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4f46e5',
  },
  radioLabel: {
    fontSize: 16,
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statusText: {
    marginTop: 4,
    marginBottom: 6,
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

