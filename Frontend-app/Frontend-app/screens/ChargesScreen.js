import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import ChargeList from '../components/ChargeList';
import { fetchCharges } from '../services/chargeService';
import { AuthContext } from '../context/AuthContext';

const ChargesScreen = ({ navigation }) => {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadCharges = async () => {
      try {
        const data = await fetchCharges(user?.token);
        setCharges(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch charges');
      } finally {
        setLoading(false);
      }
    };
    loadCharges();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Charges</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <ChargeList charges={charges} />
      )}
      <Button title="Add Charge" onPress={() => navigation.navigate('AddCharge')} />
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

export default ChargesScreen;
