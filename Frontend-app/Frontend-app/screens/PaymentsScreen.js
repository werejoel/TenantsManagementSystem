import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import PaymentList from '../components/PaymentList';
import { fetchPayments } from '../services/paymentService';
import { AuthContext } from '../context/AuthContext';

const PaymentsScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const data = await fetchPayments(user?.token);
        setPayments(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch payments');
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payments</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <PaymentList payments={payments} />
      )}
      <Button title="Record Payment" onPress={() => navigation.navigate('AddPayment')} />
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

export default PaymentsScreen;
