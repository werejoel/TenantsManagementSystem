import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const MAINTENANCE_LIST_URL = 'http://127.0.0.1:8000/api/maintenance/all/';
const MAINTENANCE_UPDATE_URL = 'http://127.0.0.1:8000/api/maintenance/';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const MaintenanceRequestsManagerScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access');
      const response = await axios.get(MAINTENANCE_LIST_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch maintenance requests.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditStatus(item.status);
    setEditNotes(item.notes);
  };

  const saveEdit = async (id) => {
    try {
      const token = await AsyncStorage.getItem('access');
      await axios.patch(
        `${MAINTENANCE_UPDATE_URL}${id}/update/`,
        { status: editStatus, notes: editNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      fetchRequests();
      Alert.alert('Success', 'Request updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update request.');
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.label}>Tenant: <Text style={styles.value}>{item.tenant_name}</Text></Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{item.description}</Text>
      <Text style={styles.label}>Status:</Text>
      {editingId === item.id ? (
        <View style={styles.row}>
          {statusOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.statusButton, editStatus === opt.value && styles.statusButtonActive]}
              onPress={() => setEditStatus(opt.value)}
            >
              <Text style={styles.statusButtonText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.value}>{item.status.replace('_', ' ')}</Text>
      )}
      <Text style={styles.label}>Notes:</Text>
      {editingId === item.id ? (
        <TextInput
          style={styles.input}
          value={editNotes}
          onChangeText={setEditNotes}
          placeholder="Add notes..."
          multiline
        />
      ) : (
        <Text style={styles.value}>{item.notes || '-'}</Text>
      )}
      <Text style={styles.label}>Created: <Text style={styles.value}>{item.created_at}</Text></Text>
      {editingId === item.id ? (
        <TouchableOpacity style={styles.saveButton} onPress={() => saveEdit(item.id)}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.editButton} onPress={() => startEdit(item)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4caf50" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>All Maintenance Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  value: {
    color: '#444',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  statusButton: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  statusButtonActive: {
    backgroundColor: '#4caf50',
  },
  statusButtonText: {
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    minHeight: 40,
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MaintenanceRequestsManagerScreen;