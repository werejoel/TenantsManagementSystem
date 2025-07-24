import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, Alert, ActivityIndicator, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchHouses } from '../services/houseService';
import { assignTenantToHouse } from '../services/tenantService';

const AssignHouseScreen = ({ route, navigation }) => {
  const { user } = useContext(AuthContext);
  const { tenant } = route.params;
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const data = await fetchHouses(user?.token);
        setHouses(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch houses');
      } finally {
        setLoading(false);
      }
    };
    loadHouses();
  }, [user]);

  const handleAssign = async (houseId) => {
    try {
      await assignTenantToHouse(tenant.id, houseId, user?.token);
      Alert.alert('Success', 'Tenant assigned to house');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign house');
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#000" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign House to {tenant.name}</Text>
      <FlatList
        data={houses}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.houseItem} onPress={() => handleAssign(item.id)}>
            <Text style={styles.houseName}>{item.name}</Text>
            <Text>Location: {item.location}</Text>
            <Text>Price: UGX {item.price}</Text>
            <Text>Occupied: {item.is_occupied ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  houseItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 8 },
  houseName: { fontWeight: 'bold', fontSize: 16 },
});

export default AssignHouseScreen;
