import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const PaymentForm = ({ onSubmit, initialValues = {} }) => {
  const [amountPaid, setAmountPaid] = useState(initialValues.amount_paid ? String(initialValues.amount_paid) : '');
  const [rentAmountDue, setRentAmountDue] = useState(initialValues.rent_amount_due ? String(initialValues.rent_amount_due) : '');
  const [paymentStartDate, setPaymentStartDate] = useState(initialValues.payment_start_date || '');
  const [paymentEndDate, setPaymentEndDate] = useState(initialValues.payment_end_date || '');
  const [rentDueDate, setRentDueDate] = useState(initialValues.rent_due_date || '');

  const handleSubmit = () => {
    onSubmit({
      amount_paid: parseInt(amountPaid, 10),
      rent_amount_due: parseInt(rentAmountDue, 10),
      payment_start_date: paymentStartDate,
      payment_end_date: paymentEndDate,
      rent_due_date: rentDueDate,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Amount Paid</Text>
      <TextInput style={styles.input} value={amountPaid} onChangeText={setAmountPaid} keyboardType="numeric" />
      <Text style={styles.label}>Rent Amount Due</Text>
      <TextInput style={styles.input} value={rentAmountDue} onChangeText={setRentAmountDue} keyboardType="numeric" />
      <Text style={styles.label}>Payment Start Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={paymentStartDate} onChangeText={setPaymentStartDate} />
      <Text style={styles.label}>Payment End Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={paymentEndDate} onChangeText={setPaymentEndDate} />
      <Text style={styles.label}>Rent Due Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={rentDueDate} onChangeText={setRentDueDate} />
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

export default PaymentForm;
