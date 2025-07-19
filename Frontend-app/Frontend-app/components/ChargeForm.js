import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const ChargeForm = ({ onSubmit, initialValues = {} }) => {
  const [chargeType, setChargeType] = useState(initialValues.charge_type || '');
  const [amount, setAmount] = useState(initialValues.amount ? String(initialValues.amount) : '');
  const [chargeDate, setChargeDate] = useState(initialValues.charge_date || '');
  const [dueDate, setDueDate] = useState(initialValues.due_date || '');
  const [isPaid, setIsPaid] = useState(initialValues.is_paid || false);

  const handleSubmit = () => {
    onSubmit({
      charge_type: chargeType,
      amount: parseInt(amount, 10),
      charge_date: chargeDate,
      due_date: dueDate,
      is_paid: isPaid,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Charge Type</Text>
      <TextInput style={styles.input} value={chargeType} onChangeText={setChargeType} />
      <Text style={styles.label}>Amount</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Text style={styles.label}>Charge Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={chargeDate} onChangeText={setChargeDate} />
      <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} />
      <Text style={styles.label}>Paid</Text>
      <TextInput style={styles.input} value={isPaid ? 'Yes' : 'No'} onChangeText={val => setIsPaid(val.toLowerCase() === 'yes')} />
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

export default ChargeForm;
