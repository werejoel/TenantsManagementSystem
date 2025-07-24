
import React, { useContext } from 'react';
import { FlatList, View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { deactivateTenant } from '../services/tenantService';

const TenantList = ({ tenants, onActionComplete }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const handleDeactivate = async (id) => {
    try {
      await deactivateTenant(id, user?.token);
      Alert.alert('Success', 'Tenant deactivated');
      if (onActionComplete) onActionComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to deactivate tenant');
    }
  };

  const handleEdit = (tenant) => {
    navigation.navigate('EditTenant', { tenant });
    const unsubscribe = navigation.addListener('focus', () => {
      if (onActionComplete) onActionComplete();
      unsubscribe();
    });
  };

  const handleAssignHouse = (tenant) => {
    navigation.navigate('AssignHouse', { tenant });
    const unsubscribe = navigation.addListener('focus', () => {
      if (onActionComplete) onActionComplete();
      unsubscribe();
    });
  };

  return (
    <FlatList
      data={tenants}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <Text>{item.email}</Text>
          <Text>{item.phone}</Text>
          <Text>Status: {item.status}</Text>
          <View style={styles.actions}>
            <Button title="Edit" onPress={() => handleEdit(item)} />
            <Button title="Deactivate" color="#d9534f" onPress={() => handleDeactivate(item.id)} />
            <Button title="Assign House" onPress={() => handleAssignHouse(item)} />
          </View>
        </View>
      )}
    />
  );
};


const styles = StyleSheet.create({
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
});

export default TenantList;
