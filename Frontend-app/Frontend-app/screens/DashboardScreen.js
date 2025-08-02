import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDashboard, refreshToken, getRecentActivities } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [dashboard, setDashboard] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const { logout } = useContext(AuthContext);

  // Get user data from dashboard API response
  const user = dashboard && dashboard.user ? {
    name: dashboard.user.full_name || dashboard.user.name || '',
    email: dashboard.user.email || '',
    profilePicture: dashboard.user.avatar || dashboard.user.profile_picture || 'https://via.placeholder.com/150',
    lastLogin: dashboard.user.last_login || dashboard.user.lastLogin || '',
  } : {
    name: '',
    email: '',
    profilePicture: 'https://via.placeholder.com/150',
    lastLogin: '',
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access');
      await AsyncStorage.removeItem('refresh');
      logout();
    } catch (error) {
      console.error('Error during logout:', error);
      logout();
    }
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchDashboard = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    let token = await AsyncStorage.getItem('access');

    if (!token) {
      handleLogout();
      setLoading(false);
      return;
    }

    try {
      const response = await getDashboard(token);
     // console.log('DASHBOARD API RESPONSE:', response.data);
      setDashboard(response.data);
      if (showLoader) animateIn();
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (error.response && error.response.status === 401) {
        const refresh = await AsyncStorage.getItem('refresh');
        if (refresh) {
          try {
            const refreshResponse = await refreshToken(refresh);
            token = refreshResponse.data.access;
            await AsyncStorage.setItem('access', token);
            const response = await getDashboard(token);
            setDashboard(response.data);
            if (showLoader) animateIn();
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            handleLogout();
            setLoading(false);
            return;
          }
        } else {
          handleLogout();
          setLoading(false);
          return;
        }
      } else {
        console.error('Failed to fetch dashboard:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      const response = await getRecentActivities(token);
      setRecentActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(false);
    fetchRecentActivities();
  };

  useEffect(() => {
    fetchDashboard();
    fetchRecentActivities();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <View style={styles.loadingContent}>
          <Animated.View style={[styles.loadingIcon, {
            transform: [{
              rotate: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }]
          }]}>
            <MaterialCommunityIcons name="view-dashboard" size={64} color="#4caf50" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
          <View style={styles.loadingBar}>
            <Animated.View style={[styles.loadingProgress, {
              width: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              })
            }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <View style={styles.errorContent}>
          <MaterialCommunityIcons name="wifi-off" size={80} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>Unable to load dashboard data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboard()}>
            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const roleConfig = {
    manager: { icon: 'account-tie', label: 'Manager', color: '#2196F3' },
    tenant: { icon: 'account', label: 'Tenant', color: '#4caf50' },
    landlord: { icon: 'account-cash', label: 'Landlord', color: '#FF9800' },
    admin: { icon: 'account-star', label: 'Admin', color: '#9C27B0' },
  };

  const roleKey = dashboard.role && roleConfig[dashboard.role.toLowerCase()]
    ? dashboard.role.toLowerCase()
    : 'tenant';
  const roleIcon = roleConfig[roleKey]?.icon || 'account';
  const roleLabel = roleConfig[roleKey]?.label || 'Tenant';
  const roleColor = roleConfig[roleKey]?.color || '#4caf50';

  const getQuickActions = () => {
    const baseActions = [
      { icon: 'account-group', label: 'Tenants', action: () => navigation.navigate('Tenants') },
      { icon: 'cash-multiple', label: 'Payments', action: () => navigation.navigate('Payments') },
    ];

    if (dashboard.role === 'manager' || dashboard.role === 'admin') {
      baseActions.push(
        { icon: 'chart-line', label: 'Reports', action: () => navigation.navigate('Reports') },
        { icon: 'cog', label: 'Settings', action: () => navigation.navigate('Settings') },
        { icon: 'account-plus', label: 'Add Tenant', action: () => navigation.navigate('AddTenant') }
      );
    } else if (dashboard.role === 'tenant') {
      baseActions.push(
        { icon: 'credit-card', label: 'Pay Rent', action: () => navigation.navigate('PayRent') },
        { icon: 'file-document', label: 'View Lease', action: () => navigation.navigate('Lease') }
      );
    }

    return baseActions;
  };

  const quickActions = getQuickActions();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <MaterialCommunityIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>Dashboard</Text>
            <Text style={styles.headerSubtext}>Welcome back, {user.name}!</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4caf50']} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.scrollContent, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }]}>
          {/*
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profilePicture}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.dashboardTitle}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userRoleRow}>
                  <MaterialCommunityIcons name={roleIcon} size={18} color={roleColor} style={{ marginRight: 4 }} />
                  <Text style={styles.userRoleText}>{roleLabel}</Text>
                </View>
              </View>
            </View>
          </View>
*/}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Tenants')}
              >
                <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="account-group" size={24} color="#2196F3" />
                </View>
                <Text style={styles.statValue}>{dashboard.total_tenants || 0}</Text>
                <Text style={styles.statLabel}>
                  {dashboard.role === 'manager' ? 'Total Tenants' : 'My Tenants'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Payments')}
              >
                <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={24} color="#4caf50" />
                </View>
                <Text style={styles.statValue}>UGX {dashboard.total_payments || 0}</Text>
                <Text style={styles.statLabel}>Payments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Balance')}
              >
                <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="bank" size={24} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>UGX {dashboard.total_balance || '0.00'}</Text>
                <Text style={styles.statLabel}>Balance</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Overpayment')}
              >
                <View style={[styles.statIcon, { backgroundColor: '#FCE4EC' }]}>
                  <MaterialCommunityIcons name="credit-card-refund" size={24} color="#E91E63" />
                </View>
                <Text style={styles.statValue}>UGX {dashboard.total_overpayment || '0.00'}</Text>
                <Text style={styles.statLabel}>Overpayment</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={action.action}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name={action.icon} size={28} color="#4caf50" />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.activityContainer}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <MaterialCommunityIcons name="history" size={24} color="#4caf50" />
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityText}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{activity.timestamp}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.activityCard}>
                <MaterialCommunityIcons name="information" size={24} color="#4caf50" />
                <Text style={styles.activityText}>No recent activity</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4caf50',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtext: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  userRoleText: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
  },
  lastLogin: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: (width - 60) / 2,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 8,
    fontWeight: '600',
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '600',
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityDetails: {
    marginLeft: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  activityTime: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default DashboardScreen;