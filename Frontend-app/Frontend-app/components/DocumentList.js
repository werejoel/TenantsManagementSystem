import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const DocumentList = ({ documents }) => {
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.type}>{item.document_type}</Text>
      <Text>Tenant: {item.tenant ? item.tenant.name : 'N/A'}</Text>
      <Text>House: {item.house ? item.house.name : 'N/A'}</Text>
      <Text>File: {item.file_path}</Text>
      <Text>Date: {item.upload_date}</Text>
      <Text>Description: {item.description}</Text>
    </View>
  );

  return (
    <FlatList
      data={documents}
      keyExtractor={item => item.id?.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  item: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
    elevation: 1,
  },
  type: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
});

export default DocumentList;
