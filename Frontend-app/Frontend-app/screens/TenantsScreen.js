import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import TenantList from '../components/TenantList';
import { fetchTenants } from '../services/tenantService';
import { AuthContext } from '../context/AuthContext';

const TenantsScreen = ({ navigation }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const data = await fetchTenants(user?.token);
        setTenants(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch tenants');
      } finally {
        setLoading(false);
      }
    };
    loadTenants();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tenants</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <TenantList tenants={tenants} />
      )}
      <Button title="Add Tenant" onPress={() => navigation.navigate('AddTenant')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default TenantsScreen;
