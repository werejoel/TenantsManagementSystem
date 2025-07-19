import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDashboard, refreshToken } from '../services/authService'; // Added refreshToken import
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardScreen = ({ navigation }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useContext(AuthContext);

  // Logout handler
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access');
      await AsyncStorage.removeItem('refresh');
      logout();
      // The MainNavigator will screen switch to Login
    } catch (error) {
      console.error('Error during logout:', error);
      logout();
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      let token = await AsyncStorage.getItem('access');
      
      try {
        const response = await getDashboard(token);
        setDashboard(response.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        
        if (error.response && error.response.status === 401) {
          // Try to refresh token
          const refresh = await AsyncStorage.getItem('refresh');
          if (refresh) {
            try {
              const refreshResponse = await refreshToken(refresh);
              token = refreshResponse.data.access;
              await AsyncStorage.setItem('access', token);
              
              // Retry fetching dashboard with new token
              const response = await getDashboard(token);
              setDashboard(response.data);
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // If refresh fails, logout user
              handleLogout();
              return;
            }
          } else {
            // No refresh token available, logout user
            handleLogout();
            return;
          }
        } else {
          // Other error, you might want to show an error message
          console.error('Failed to fetch dashboard:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="progress-clock" size={48} color="#4f8cff" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={styles.loadingText}>Failed to load dashboard</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setLoading(true);
          // Re-trigger the useEffect
          const fetchDashboard = async () => {
            let token = await AsyncStorage.getItem('access');
            try {
              const response = await getDashboard(token);
              setDashboard(response.data);
            } catch (error) {
              console.error('Retry failed:', error);
            } finally {
              setLoading(false);
            }
          };
          fetchDashboard();
        }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.openDrawer()}>
          <MaterialCommunityIcons name="menu" size={28} color="#4f8cff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#4f8cff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <MaterialCommunityIcons name="view-dashboard" size={48} color="#4f8cff" style={{ marginBottom: 8 }} />
          <Text style={styles.title}>{dashboard.dashboard}</Text>
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons 
              name={dashboard.role === 'manager' ? 'account-tie' : 'account'} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.roleText}>
              {dashboard.role.charAt(0).toUpperCase() + dashboard.role.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="account-group" size={32} color="#4f8cff" />
            <Text style={styles.statLabel}>
              {dashboard.role === 'manager' ? 'Total Tenants' : 'My Tenants'}
            </Text>
            <Text style={styles.statValue}>{dashboard.total_tenants || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="cash-multiple" size={32} color="#4f8cff" />
            <Text style={styles.statLabel}>Payments</Text>
            <Text style={styles.statValue}>{dashboard.total_payments || 0}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="bank" size={32} color="#4f8cff" />
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statValue}>{dashboard.total_balance || '0.00'}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="credit-card-refund" size={32} color="#4f8cff" />
            <Text style={styles.statLabel}>Overpayment</Text>
            <Text style={styles.statValue}>{dashboard.total_overpayment || '0.00'}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4f8cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  headerCard: {
    width: '95%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
    backgroundColor: 'transparent',
  },
  headerButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default DashboardScreen;