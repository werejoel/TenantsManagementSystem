import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Button, Divider, useTheme, FAB } from 'react-native-paper';
import TenantList from '../components/TenantList';
import { fetchTenants } from '../services/tenantService';
import { AuthContext } from '../context/AuthContext';

const TenantsScreen = ({ navigation }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);


  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await fetchTenants(user?.token);
      setTenants(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [user]);

  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Tenants</Text>
      </View>
      <Divider style={styles.divider} />
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <TenantList tenants={tenants} onActionComplete={loadTenants} />
      )}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Tenant"
        onPress={async () => {
          const unsubscribe = navigation.addListener('focus', loadTenants);
          navigation.navigate('AddTenant');
          setTimeout(() => unsubscribe(), 1000);
        }}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#f7f8fa',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 18,
    marginHorizontal: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.5,
  },
  divider: {
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
    height: 1.5,
    marginHorizontal: 18,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#1976d2',
    elevation: 4,
    borderRadius: 30,
    paddingHorizontal: 12,
  },
});

export default TenantsScreen;
