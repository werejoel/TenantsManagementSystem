import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getMyHouse } from '../services/tenantService';
import { fetchPayments } from '../services/paymentService';

const TenantDashboardScreen = () => {
  const { user } = useContext(AuthContext);
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);


  useEffect(() => {
    const fetchHouse = async () => {
      try {
        const data = await getMyHouse(user?.token);
        setHouse(data);
      } catch (error) {
        setHouse(null);
      } finally {
        setLoading(false);
      }
    };
    fetchHouse();
  }, [user]);

  useEffect(() => {
    const fetchMyPayments = async () => {
      setPaymentsLoading(true);
      try {
        const allPayments = await fetchPayments(user?.token);
        // Filter payments for this user if not already filtered by backend
        const myPayments = allPayments.filter(p => p.tenant && p.tenant.user === user?.id);
        setPayments(myPayments);
      } catch (error) {
        setPayments([]);
      } finally {
        setPaymentsLoading(false);
      }
    };
    fetchMyPayments();
  }, [user]);

  // Calculate current balance and arrears
  const currentBalance = payments.length > 0 ? payments[0].balance_due : 0;
  const overpayment = payments.length > 0 ? payments[0].overpayment : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="account" size={48} color="#4f8cff" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>Tenant Dashboard</Text>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons name="account" size={20} color="#fff" />
          <Text style={styles.roleText}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Tenant'}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="cash" size={32} color="#4f8cff" />
          <Text style={styles.statLabel}>Current Balance</Text>
          <Text style={styles.statValue}>UGX {currentBalance}</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="cash-refund" size={32} color="#4f8cff" />
          <Text style={styles.statLabel}>Overpayment</Text>
          <Text style={styles.statValue}>UGX {overpayment}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {paymentsLoading ? (
          <ActivityIndicator size="small" color="#4f8cff" />
        ) : payments.length === 0 ? (
          <Text>No payments found.</Text>
        ) : (
          payments.map((p, idx) => (
            <View key={p.id || idx} style={styles.paymentItem}>
              <Text>Date: {p.payment_date}</Text>
              <Text>Amount Paid: UGX {p.amount_paid}</Text>
              <Text>Period: {p.payment_start_date} to {p.payment_end_date}</Text>
              <Text>Balance Due: UGX {p.balance_due}</Text>
              <Text>Overpayment: UGX {p.overpayment}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  headerCard: {
    width: '95%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default TenantDashboardScreen;
