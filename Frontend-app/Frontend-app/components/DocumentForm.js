import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const DocumentForm = ({ onSubmit, initialValues = {} }) => {
  const [documentType, setDocumentType] = useState(initialValues.document_type || '');
  const [filePath, setFilePath] = useState(initialValues.file_path || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [tenantId, setTenantId] = useState(initialValues.tenant || '');
  const [houseId, setHouseId] = useState(initialValues.house || '');

  const handleSubmit = () => {
    onSubmit({
      document_type: documentType,
      file_path: filePath,
      description,
      tenant: tenantId,
      house: houseId,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Document Type</Text>
      <TextInput style={styles.input} value={documentType} onChangeText={setDocumentType} />
      <Text style={styles.label}>File Path</Text>
      <TextInput style={styles.input} value={filePath} onChangeText={setFilePath} />
      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} />
      <Text style={styles.label}>Tenant ID</Text>
      <TextInput style={styles.input} value={tenantId} onChangeText={setTenantId} />
      <Text style={styles.label}>House ID</Text>
      <TextInput style={styles.input} value={houseId} onChangeText={setHouseId} />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
});

export default DocumentForm;
