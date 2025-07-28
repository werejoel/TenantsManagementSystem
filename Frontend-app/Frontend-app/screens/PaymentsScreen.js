
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, TextInput } from 'react-native';
import PaymentList from '../components/PaymentList';
import { fetchPayments } from '../services/paymentService';
import { AuthContext } from '../context/AuthContext';

const PaymentsScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
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

  // Filter payments by tenant name and date range
  const filteredPayments = payments.filter(p => {
    const matchesTenant = filterTenant ? (p.tenant_name || '').toLowerCase().includes(filterTenant.toLowerCase()) : true;
    const matchesStart = filterStart ? p.payment_date >= filterStart : true;
    const matchesEnd = filterEnd ? p.payment_date <= filterEnd : true;
    return matchesTenant && matchesStart && matchesEnd;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payments</Text>
      <View style={styles.filters}>
        <TextInput style={styles.input} placeholder="Filter by Tenant" value={filterTenant} onChangeText={setFilterTenant} />
        <TextInput style={styles.input} placeholder="Start Date (YYYY-MM-DD)" value={filterStart} onChangeText={setFilterStart} />
        <TextInput style={styles.input} placeholder="End Date (YYYY-MM-DD)" value={filterEnd} onChangeText={setFilterEnd} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <PaymentList payments={filteredPayments} />
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
  filters: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
});

export default PaymentsScreen;
