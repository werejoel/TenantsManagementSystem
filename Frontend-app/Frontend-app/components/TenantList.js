import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';

const TenantList = ({ tenants }) => {
  return (
    <FlatList
      data={tenants}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <Text>{item.email}</Text>
          <Text>{item.phone}</Text>
          <Text>Status: {item.status}</Text>
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

export default TenantList;
