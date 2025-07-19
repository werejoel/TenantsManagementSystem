import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';

const HouseList = ({ houses }) => {
  return (
    <FlatList
      data={houses}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <Text>Model: {item.model}</Text>
          <Text>Location: {item.location}</Text>
          <Text>Price: UGX {item.price}</Text>
          <Text>Occupied: {item.is_occupied ? 'Yes' : 'No'}</Text>
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

export default HouseList;
