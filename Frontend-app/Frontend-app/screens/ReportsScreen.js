import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReportsScreen = () => {
  // TODO: Fetch and display reports from backend
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      {/* Add report filters and results here */}
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

export default ReportsScreen;
