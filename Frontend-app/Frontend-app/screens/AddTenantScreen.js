import React, { useContext } from 'react';
import { View, Alert } from 'react-native';
import TenantForm from '../components/TenantForm';
import { AuthContext } from '../context/AuthContext';
import { addTenant } from '../services/tenantService';

const AddTenantScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const handleAddTenant = async (tenantData) => {
    console.log('Manager token:', user?.token);
    try {
      await addTenant(tenantData, user?.token);
      Alert.alert('Success', 'Tenant added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add tenant');
    }
  };

  return (
    <View>
      <TenantForm onSubmit={handleAddTenant} />
    </View>
  );
};

export default AddTenantScreen;
