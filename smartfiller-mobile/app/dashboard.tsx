import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const BASE_URL = 'http://10.122.66.89:5050';

interface UserProfile {
  email?: string;
  name?: string;
  company_name?: string;
  role?: string;
}

interface Machine {
  id: string;
  name: string;
  description: string;
  status: 'Running' | 'Idle' | 'Offline';
  location: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    let token = await AsyncStorage.getItem('token');

    if (!token) {
      console.error('No token found, redirecting to login.');
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    try {
      const userResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const profile: UserProfile = await userResponse.json();
        setUserProfile(profile);
      } else {
        console.error('Failed to fetch profile:', userResponse.status);
        await AsyncStorage.removeItem('token');
        router.replace('/login');
        return;
      }

      const machinesResponse = await fetch(`${BASE_URL}/api/machines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (machinesResponse.ok) {
        const data = await machinesResponse.json();
        setMachines(data.machines || []);
      } else {
        console.error('Failed to fetch machines:', machinesResponse.status);
      }

      const usersResponse = await fetch(`${BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const data = await usersResponse.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', usersResponse.status);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert("Error", "Failed to load dashboard data. Please check your network connection or try again.");
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = async (): Promise<void> => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          router.replace('/login');
        },
      },
    ]);
  };

  const activeMachines = machines.filter(machine => machine.status === 'Running').length;

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </LinearGradient>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Not authenticated. Redirecting...</Text>
      </View>
    );
  }

  const SMALLER_HEADER_HEIGHT = width * 0.3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.headerShadowWrapper, {
        height: SMALLER_HEADER_HEIGHT,
        borderBottomLeftRadius: width / 2,
        borderBottomRightRadius: width / 2,
      }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradientContent, {
            height: SMALLER_HEADER_HEIGHT,
            borderBottomLeftRadius: width / 2,
            borderBottomRightRadius: width / 2,
          }]}
        >
          <View style={styles.headerTopContent}>
            <View style={styles.headerGreetingContent}>
              <Text style={styles.greeting}>Hi, {userProfile?.name || 'User'}! 👋</Text>
              <Text style={styles.welcome}>{userProfile?.company_name}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollViewContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statCardsContainer}>
          <View style={styles.statCardsRow}>
            <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#2196f3' }]}>
                <Text style={styles.statEmoji}>🏭</Text>
              </View>
              <Text style={styles.statLabel}>Total Machines</Text>
              <Text style={styles.statNumber}>{machines.length}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#e8f5e8' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#4caf50' }]}>
                <Text style={styles.statEmoji}>✅</Text>
              </View>
              <Text style={styles.statLabel}>Active Now</Text>
              <Text style={styles.statNumber}>{activeMachines}</Text>
            </View>
          </View>

          <View style={styles.statCardsRow}>
            <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#9c27b0' }]}>
                <Text style={styles.statEmoji}>👥</Text>
              </View>
              <Text style={styles.statLabel}>Total Users</Text>
              <Text style={styles.statNumber}>{users.length}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#ffe0b2' }]}>
              <View style={[styles.statIcon, { backgroundColor: '#ff9800' }]}>
                <Text style={styles.statEmoji}>⚡</Text>
              </View>
              <Text style={styles.statLabel}>Power Usage</Text>
              <Text style={styles.statNumber}>Avg. 50kW</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🏭 Your Top Machines</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.machinesHorizontalScroll}>
            {machines.slice(0, 3).length === 0 ? (
              <Text style={styles.noDataText}>No machines to display.</Text>
            ) : (
              machines.slice(0, 3).map((machine) => (
                <TouchableOpacity
                  key={machine.id}
                  style={styles.machineCard}
                  onPress={() => router.push(`/machine/${machine.id}`)}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.machineCardGradient}
                  >
                    <View style={styles.machineCardHeader}>
                      <View style={styles.machineAvatar}>
                        <Text style={styles.machineAvatarText}>
                          {machine.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: machine.status === 'Running' ? '#4caf50' : '#f44336' }
                      ]} />
                    </View>
                    <Text style={styles.machineName}>{machine.name}</Text>
                    <Text style={styles.machineDescription} numberOfLines={2}>{machine.description}</Text>
                    <View style={styles.machineCardFooter}>
                      <Text style={styles.machineLocation}>📍 {machine.location}</Text>
                      <Text style={styles.machineArrow}>➔</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
            </View>
            <View style={styles.quickActionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/add-machine')}>
                    <Icon name="add-business" size={28} color="#fff" />
                    <Text style={styles.actionButtonText}>Add Machine</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/add-user')}>
                    <Icon name="person-add-alt-1" size={28} color="#fff" />
                    <Text style={styles.actionButtonText}>Add User</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/reports')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noDataText}>No recent activity to display.</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  fallbackText: {
    fontSize: 16,
    color: '#666',
  },

  headerShadowWrapper: {
    width: width,
    height: width * 0.3,
    borderBottomLeftRadius: width / 2,
    borderBottomRightRadius: width / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    position: 'relative',
    zIndex: 10,
    marginBottom: 0,
  },
  headerGradientContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  headerTopContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    top: 50,
    paddingHorizontal: 20,
  },
  headerGreetingContent: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  welcome: {
    fontSize: 14,
    color: '#f0f0f0',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 10,
  },
  menuDropdown: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuText: {
    color: '#333',
    marginLeft: 8,
    fontSize: 16,
  },

  content: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  statCardsContainer: {
    marginBottom: 20,
  },
  statCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 0.48,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  viewAllText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },

  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  machinesHorizontalScroll: {
    paddingTop: 10,
    paddingRight: 10,
  },
  machineCard: {
    width: width * 0.4,
    marginRight: 15,
    marginBottom: 5,
    borderRadius: 12,
  },
  machineCardGradient: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  machineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  machineAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  machineAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  machineName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  machineDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  machineCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  machineLocation: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  machineArrow: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
});

export default Dashboard;
