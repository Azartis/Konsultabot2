/**
 * Admin Dashboard Screen for KonsultaBot RBAC
 * Accessible by admin and it_staff roles only
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  getUserProfile, 
  logout, 
  canViewAnalytics, 
  canEditKnowledgeBase,
  createAuthenticatedAxios,
  getRoleDisplayName,
  getRoleColor
} from '../utils/authUtils';

const { width } = Dimensions.get('window');

export default function AdminDashboard({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const profile = await getUserProfile();
      setUserProfile(profile);
      
      // Load dashboard data
      await Promise.all([
        loadUserStats(),
        loadSystemHealth()
      ]);
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const axiosInstance = await createAuthenticatedAxios();
      const response = await axiosInstance.get('/users/stats/');
      setUserStats(response.data);
    } catch (error) {
      console.error('User stats error:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      // This would connect to your Django health endpoint
      const response = await fetch('http://192.168.1.17:8000/api/v1/chat/health/');
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('System health error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('LoginScreen');
          }
        }
      ]
    );
  };

  const navigateToChat = () => {
    navigation.navigate('AdvancedChatScreen');
  };

  const navigateToUserManagement = async () => {
    if (userProfile?.role === 'admin') {
      // Navigate to user management screen
      Alert.alert('Info', 'User Management feature coming soon!');
    } else {
      Alert.alert('Access Denied', 'Only administrators can manage users.');
    }
  };

  const navigateToAnalytics = async () => {
    const canView = await canViewAnalytics();
    if (canView) {
      // Navigate to analytics screen
      Alert.alert('Info', 'Analytics dashboard feature coming soon!');
    } else {
      Alert.alert('Access Denied', 'You do not have permission to view analytics.');
    }
  };

  const navigateToKnowledgeBase = async () => {
    const canEdit = await canEditKnowledgeBase();
    if (canEdit) {
      // Navigate to knowledge base editor
      Alert.alert('Info', 'Knowledge Base editor feature coming soon!');
    } else {
      Alert.alert('Access Denied', 'You do not have permission to edit the knowledge base.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C9EF6" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#4C9EF6', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={30} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {userProfile?.first_name || userProfile?.username || 'Admin User'}
              </Text>
              <View style={styles.roleContainer}>
                <View style={[
                  styles.roleBadge, 
                  { backgroundColor: getRoleColor(userProfile?.role) }
                ]}>
                  <Text style={styles.roleText}>
                    {getRoleDisplayName(userProfile?.role)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        
        <View style={styles.statsGrid}>
          {/* Total Users */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={24} color="#4C9EF6" />
            </View>
            <Text style={styles.statNumber}>
              {userStats?.total_users || '0'}
            </Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          {/* Active Users */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="person-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>
              {userStats?.active_users || '0'}
            </Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>

          {/* IT Staff */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="construct" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>
              {userStats?.it_staff_count || '0'}
            </Text>
            <Text style={styles.statLabel}>IT Staff</Text>
          </View>

          {/* Students */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="school" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.statNumber}>
              {userStats?.student_count || '0'}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>
      </View>

      {/* System Health */}
      {systemHealth && (
        <View style={styles.healthContainer}>
          <Text style={styles.sectionTitle}>System Health</Text>
          
          <View style={styles.healthCard}>
            <View style={styles.healthItem}>
              <View style={styles.healthIndicator}>
                <View style={[
                  styles.healthDot,
                  { backgroundColor: systemHealth.database?.connected ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.healthLabel}>Database</Text>
              </View>
              <Text style={styles.healthStatus}>
                {systemHealth.database?.connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>

            <View style={styles.healthItem}>
              <View style={styles.healthIndicator}>
                <View style={[
                  styles.healthDot,
                  { backgroundColor: systemHealth.ai_services?.local_ai_available ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.healthLabel}>AI Services</Text>
              </View>
              <Text style={styles.healthStatus}>
                {systemHealth.ai_services?.local_ai_available ? 'Available' : 'Unavailable'}
              </Text>
            </View>

            <View style={styles.healthItem}>
              <View style={styles.healthIndicator}>
                <View style={[
                  styles.healthDot,
                  { backgroundColor: systemHealth.network?.connected ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.healthLabel}>Network</Text>
              </View>
              <Text style={styles.healthStatus}>
                {systemHealth.network?.connected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={navigateToChat}>
          <View style={styles.actionIcon}>
            <Ionicons name="chatbubbles" size={24} color="#4C9EF6" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Chat Interface</Text>
            <Text style={styles.actionDescription}>Access the AI chatbot</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={navigateToAnalytics}>
          <View style={styles.actionIcon}>
            <Ionicons name="analytics" size={24} color="#10B981" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Analytics</Text>
            <Text style={styles.actionDescription}>View usage statistics</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={navigateToKnowledgeBase}>
          <View style={styles.actionIcon}>
            <Ionicons name="library" size={24} color="#F59E0B" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Knowledge Base</Text>
            <Text style={styles.actionDescription}>Edit IT support content</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {userProfile?.role === 'admin' && (
          <TouchableOpacity style={styles.actionButton} onPress={navigateToUserManagement}>
            <View style={styles.actionIcon}>
              <Ionicons name="people-circle" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>User Management</Text>
              <Text style={styles.actionDescription}>Manage user accounts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  healthContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  healthCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  healthLabel: {
    fontSize: 14,
    color: '#374151',
  },
  healthStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
});
