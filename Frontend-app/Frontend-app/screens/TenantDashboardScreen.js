import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const TenantDashboardScreen = () => {
  const { user } = useContext(AuthContext);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="account" size={48} color="#4f8cff" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>Tenant Dashboard</Text>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="account" size={20} color="#fff" />
          <Text style={styles.roleText}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Tenant'}</Text>
        </View>
      </View>
      {/* Add tenant-specific stats and controls here */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="home-city" size={32} color="#4f8cff" />
          <Text style={styles.statLabel}>My House</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="cash-multiple" size={32} color="#4f8cff" />
          <Text style={styles.statLabel}>My Payments</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
      </View>
      {/* Add more cards as needed */}
    </ScrollView>
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
});

export default TenantDashboardScreen;
