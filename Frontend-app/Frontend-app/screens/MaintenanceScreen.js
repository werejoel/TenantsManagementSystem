import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const MaintenanceScreen = ({ navigation }) => {
  // TODO: Fetch maintenance requests from backend and display
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maintenance Requests</Text>
      {/* List maintenance requests here */}
      <Button title="Submit Request" onPress={() => navigation.navigate('AddMaintenanceRequest')} />
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

export default MaintenanceScreen;
