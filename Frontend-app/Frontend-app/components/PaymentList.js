import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';

const PaymentList = ({ payments }) => {
  return (
    <FlatList
      data={payments}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.name}>Tenant: {item.tenant_name}</Text>
          <Text>Amount Paid: UGX {item.amount_paid}</Text>
          <Text>Balance Due: UGX {item.balance_due}</Text>
          <Text>Overpayment: UGX {item.overpayment}</Text>
          <Text>Period: {item.payment_start_date} to {item.payment_end_date}</Text>
          <Text>Date: {item.payment_date}</Text>
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
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PaymentList;
