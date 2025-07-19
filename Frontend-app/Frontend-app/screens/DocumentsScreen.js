import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const DocumentsScreen = ({ navigation }) => {
  // TODO: Fetch documents from backend and display
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      {/* List documents here */}
      <Button title="Upload Document" onPress={() => navigation.navigate('UploadDocument')} />
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

export default DocumentsScreen;
