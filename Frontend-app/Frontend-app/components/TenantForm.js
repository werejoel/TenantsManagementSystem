
import React, { useState } from 'react';
import { StyleSheet, View ,ScrollView} from 'react-native';
import { Card, TextInput, Button, useTheme, Text, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';


const TenantForm = ({ onSubmit, initialValues = {}, onCancel }) => {
  const [name, setName] = useState(initialValues.name || '');
  const [email, setEmail] = useState(initialValues.email || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [nationalId, setNationalId] = useState(initialValues.national_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation();

  const handleSubmit = () => {
    // Validation with custom messages
    if (!name.trim()) {
      setError('Please enter the tenant\'s full name.');
      setShowError(true);
      return;
    }
    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters long.');
      setShowError(true);
      return;
    }
    if (!email.trim()) {
      setError('Please enter an email address.');
      setShowError(true);
      return;
    }
    // Improved email regex
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address (e.g. user@example.com).');
      setShowError(true);
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a phone number.');
      setShowError(true);
      return;
    }
    const phoneRegex = /^\+256[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Phone must be in the format +256XXXXXXXXX (e.g. +256705672545).');
      setShowError(true);
      return;
    }
    if (!nationalId.trim()) {
      setError('Please enter a National ID number.');
      setShowError(true);
      return;
    }
    if (nationalId.trim().length !== 14) {
      setError('National ID must be exactly 14 characters.');
      setShowError(true);
      return;
    }
    setError('');
    setShowError(false);
    setLoading(true);
    onSubmit({ name, email, phone, national_id: nationalId });
    setLoading(false);
  };

  const handleClear = () => {
    setName('');
    setEmail('');
    setPhone('');
    setNationalId('');
  };

  // Handle cancel: use onCancel if provided, else go back
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Card style={styles.card} elevation={3}>
      <Card.Title title="Tenant Details" titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }} />
      <Card.Content>
        <Snackbar
          visible={showError}
          onDismiss={() => setShowError(false)}
          duration={3000}
          style={{ backgroundColor: 'red' }}
        >
          {error}
        </Snackbar>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          style={styles.input}
          left={<TextInput.Icon icon="email" />}
        />
        <TextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          left={<TextInput.Icon icon="phone" />}
        />
        <TextInput
          label="National ID"
          value={nationalId}
          onChangeText={setNationalId}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="card-account-details" />}
        />
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitBtn}
            loading={loading}
            icon="check"
            contentStyle={{ height: 48 }}
          >
            Submit
          </Button>
          <Button
            mode="outlined"
            onPress={handleClear}
            style={styles.clearBtn}
            icon="broom"
            contentStyle={{ height: 48 }}
          >
            Clear
          </Button>
          <Button
            mode="text"
            onPress={handleCancel}
            style={styles.cancelBtn}
            icon="close"
            contentStyle={{ height: 48 }}
          >
            Cancel
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 3,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#f7f8fa',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  submitBtn: {
    flex: 1,
    borderRadius: 8,
    marginRight: 4,
    minWidth: 90,
  },
  clearBtn: {
    flex: 1,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 90,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 8,
    marginLeft: 4,
    minWidth: 90,
  },
});

export default TenantForm;
