import React, { useContext, useState } from 'react';
import { View, Alert } from 'react-native';
import TenantForm from '../components/TenantForm';
import { AuthContext } from '../context/AuthContext';
import { updateTenant } from '../services/tenantService';

const EditTenantScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const { tenant } = route.params;
  const [loading, setLoading] = useState(false);

  const handleUpdateTenant = async (tenantData) => {
    setLoading(true);
    try {
      await updateTenant(tenant.id, tenantData, user?.token);
      Alert.alert('Success', 'Tenant updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TenantForm onSubmit={handleUpdateTenant} initialValues={tenant} loading={loading} />
    </View>
  );
};

export default EditTenantScreen;
