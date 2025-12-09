import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  Divider,
  RadioButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing } from '../../theme/theme';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const SETTINGS_STORAGE_KEY = '@konsultabot_settings';

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const { themeMode, updateThemeMode } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    voiceEnabled: false,
    autoSpeak: false,
    language: 'english',
    theme: themeMode || 'dark',
    fontSize: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'bisaya', label: 'Bisaya' },
    { value: 'waray', label: 'Waray' },
    { value: 'tagalog', label: 'Tagalog' },
  ];

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' },
  ];

  const fontSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!loading) {
      saveSettings();
    }
  }, [settings, loading]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        // Sync theme with ThemeContext
        if (parsed.theme && parsed.theme !== themeMode) {
          updateThemeMode(parsed.theme);
        }
      } else {
        // If no saved settings, use current theme from context
        setSettings(prev => ({ ...prev, theme: themeMode }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      // Apply theme if changed
      if (settings.theme && settings.theme !== themeMode) {
        updateThemeMode(settings.theme);
        console.log('Theme changed to:', settings.theme);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // If theme is being updated, immediately update the global theme
    if (key === 'theme') {
      updateThemeMode(value);
    }
  };

  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from old password');
      return;
    }

    setChangingPassword(true);
    try {
      await apiService.changePassword(oldPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => {
            setPasswordDialogVisible(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
          },
        },
      ]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to change password. Please check your old password and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              notifications: true,
              voiceEnabled: false,
              autoSpeak: false,
              language: 'english',
              theme: 'dark',
              fontSize: 'medium',
            };
            setSettings(defaultSettings);
            AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Account Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => <List.Icon {...props} icon="lock" color={theme.colors.accent} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.placeholder} />}
              onPress={() => setPasswordDialogVisible(true)}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
          </Card.Content>
        </Card>

        {/* General Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>General</Text>
            
            <List.Item
              title="Notifications"
              description="Receive app notifications"
              left={(props) => <List.Icon {...props} icon="bell" color={theme.colors.accent} />}
              right={() => (
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => updateSetting('notifications', value)}
                  color={theme.colors.accent}
                />
              )}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Default Language"
              description={languages.find(lang => lang.value === settings.language)?.label}
              left={(props) => <List.Icon {...props} icon="translate" color={theme.colors.accent} />}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
            
            {languages.map((lang) => (
              <View key={lang.value} style={styles.radioItem}>
                <RadioButton
                  value={lang.value}
                  status={settings.language === lang.value ? 'checked' : 'unchecked'}
                  onPress={() => updateSetting('language', lang.value)}
                  color={theme.colors.accent}
                />
                <Text style={styles.radioLabel}>{lang.label}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Voice Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Voice & Audio</Text>
            
            <List.Item
              title="Voice Responses"
              description="Enable text-to-speech for bot responses"
              left={(props) => <List.Icon {...props} icon="volume-high" color={theme.colors.accent} />}
              right={() => (
                <Switch
                  value={settings.voiceEnabled}
                  onValueChange={(value) => updateSetting('voiceEnabled', value)}
                  color={theme.colors.accent}
                />
              )}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Auto-speak Responses"
              description="Automatically speak bot responses"
              left={(props) => <List.Icon {...props} icon="play-circle" color={theme.colors.accent} />}
              right={() => (
                <Switch
                  value={settings.autoSpeak}
                  onValueChange={(value) => updateSetting('autoSpeak', value)}
                  color={theme.colors.accent}
                  disabled={!settings.voiceEnabled}
                />
              )}
              titleStyle={[styles.listItemTitle, !settings.voiceEnabled && styles.disabledText]}
              descriptionStyle={[styles.listItemDescription, !settings.voiceEnabled && styles.disabledText]}
            />
          </Card.Content>
        </Card>

        {/* Appearance Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Appearance</Text>
            
            <List.Item
              title="Theme"
              description={themes.find(t => t.value === settings.theme)?.label}
              left={(props) => <List.Icon {...props} icon="palette" color={theme.colors.accent} />}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
            
            {themes.map((themeOption) => (
              <View key={themeOption.value} style={styles.radioItem}>
                <RadioButton
                  value={themeOption.value}
                  status={settings.theme === themeOption.value ? 'checked' : 'unchecked'}
                  onPress={() => updateSetting('theme', themeOption.value)}
                  color={theme.colors.accent}
                />
                <Text style={styles.radioLabel}>{themeOption.label}</Text>
              </View>
            ))}

            <Divider style={styles.divider} />

            <List.Item
              title="Font Size"
              description={fontSizes.find(size => size.value === settings.fontSize)?.label}
              left={(props) => <List.Icon {...props} icon="format-size" color={theme.colors.accent} />}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
            
            {fontSizes.map((size) => (
              <View key={size.value} style={styles.radioItem}>
                <RadioButton
                  value={size.value}
                  status={settings.fontSize === size.value ? 'checked' : 'unchecked'}
                  onPress={() => updateSetting('fontSize', size.value)}
                  color={theme.colors.accent}
                />
                <Text style={styles.radioLabel}>{size.label}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Help & Support */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <List.Item
              title="Help & FAQ"
              description="Get help and find answers"
              left={(props) => <List.Icon {...props} icon="help-circle" color={theme.colors.accent} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.placeholder} />}
              onPress={() => navigation.navigate('Help')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
          </Card.Content>
        </Card>

        {/* Data & Privacy */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            
            <List.Item
              title="Clear Chat History"
              description="Delete all conversation history"
              left={(props) => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
              onPress={() => {
                Alert.alert(
                  'Clear Chat History',
                  'This will permanently delete all your conversation history. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => {} },
                  ]
                );
              }}
              titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
              descriptionStyle={styles.listItemDescription}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Export Data"
              description="Export your conversation data"
              left={(props) => <List.Icon {...props} icon="download" color={theme.colors.accent} />}
              onPress={() => {
                Alert.alert('Export Data', 'This feature will be available in a future update.');
              }}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
          </Card.Content>
        </Card>

        {/* Reset Button */}
        <Button
          mode="outlined"
          onPress={resetSettings}
          style={styles.resetButton}
          textColor={theme.colors.error}
          icon="restore"
        >
          Reset to Default
        </Button>
      </ScrollView>

      {/* Password Change Dialog */}
      <Portal>
        <Dialog
          visible={passwordDialogVisible}
          onDismiss={() => setPasswordDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.passwordInput}
              placeholder="Current Password"
              secureTextEntry
              value={passwordData.oldPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, oldPassword: text }))}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password (min 8 characters)"
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              secureTextEntry
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              placeholderTextColor={theme.colors.placeholder}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialogVisible(false)} disabled={changingPassword}>
              Cancel
            </Button>
            <Button
              onPress={handleChangePassword}
              loading={changingPassword}
              disabled={changingPassword}
              mode="contained"
            >
              Change Password
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  listItemTitle: {
    color: theme.colors.text,
    fontSize: 16,
  },
  listItemDescription: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  disabledText: {
    opacity: 0.5,
  },
  divider: {
    backgroundColor: theme.colors.disabled,
    marginVertical: spacing.xs,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  radioLabel: {
    marginLeft: spacing.sm,
    color: theme.colors.text,
    fontSize: 16,
  },
  resetButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
    borderColor: theme.colors.error,
  },
  dialog: {
    backgroundColor: theme.colors.surface,
  },
  passwordInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
});
