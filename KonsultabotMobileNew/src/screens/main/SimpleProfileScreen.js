import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { lumaTheme } from '../../theme/lumaTheme';
import StarryBackground from '../../components/StarryBackground';

export default function SimpleProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        try {
          console.log('Logging out...');
          const result = await logout();
          if (result.success) {
            console.log('Logout successful');
          } else {
            alert('Failed to logout. Please try again.');
          }
        } catch (error) {
          console.error('Logout error:', error);
          alert('Failed to logout. Please try again.');
        }
      }
    } else {
      // Mobile Alert
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await logout();
                if (!result.success) {
                  Alert.alert('Error', 'Failed to logout. Please try again.');
                }
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.userName}>
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user?.username || 'EVSU Student'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || 'student@evsu.edu.ph'}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <MaterialIcons name="email" size={24} color={lumaTheme.colors.primary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Email</Text>
                <Text style={styles.menuSubtitle}>{user?.email || 'student@evsu.edu.ph'}</Text>
              </View>
            </View>

            <View style={styles.menuItem}>
              <MaterialIcons name="school" size={24} color={lumaTheme.colors.primary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Campus</Text>
                <Text style={styles.menuSubtitle}>EVSU Dulag</Text>
              </View>
            </View>

            <View style={styles.menuItem}>
              <MaterialIcons name="verified" size={24} color={lumaTheme.colors.primary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Status</Text>
                <Text style={styles.menuSubtitle}>Active Student</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="help" size={24} color={lumaTheme.colors.primary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Help & FAQ</Text>
                <Text style={styles.menuSubtitle}>Get help using KonsultaBot</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={lumaTheme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="support-agent" size={24} color={lumaTheme.colors.primary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Contact IT Support</Text>
                <Text style={styles.menuSubtitle}>Reach our IT team directly</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={lumaTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lumaTheme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: lumaTheme.colors.primary,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: lumaTheme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: lumaTheme.colors.textMuted,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: lumaTheme.colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(40, 40, 50, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(147, 51, 234, 0.1)',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: lumaTheme.colors.text,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: lumaTheme.colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});
