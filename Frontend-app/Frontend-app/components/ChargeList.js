import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';

const ChargeList = ({ charges }) => {
  return (
    <FlatList
      data={charges}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.name}>Type: {item.charge_type}</Text>
          <Text>Tenant: {item.tenant_name}</Text>
          <Text>House: {item.house_name}</Text>
          <Text>Amount: UGX {item.amount}</Text>
          <Text>Date: {item.charge_date}</Text>
          <Text>Due: {item.due_date}</Text>
          <Text>Paid: {item.is_paid ? 'Yes' : 'No'}</Text>
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

export default ChargeList;
