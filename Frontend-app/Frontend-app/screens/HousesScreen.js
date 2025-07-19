import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import HouseList from '../components/HouseList';
import { fetchHouses } from '../services/houseService';
import { AuthContext } from '../context/AuthContext';

const HousesScreen = ({ navigation }) => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Houses/Units</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <HouseList houses={houses} />
      )}
      <Button title="Add House/Unit" onPress={() => navigation.navigate('AddHouse')} />
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

export default HousesScreen;
