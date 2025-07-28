import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';


const PaymentForm = ({ onSubmit, initialValues = {} }) => {
  const [amountPaid, setAmountPaid] = useState(initialValues.amount_paid ? String(initialValues.amount_paid) : '');
  const [rentAmountDue, setRentAmountDue] = useState(initialValues.rent_amount_due ? String(initialValues.rent_amount_due) : '');
  const [paymentStartDate, setPaymentStartDate] = useState(initialValues.payment_start_date || '');
  const [paymentEndDate, setPaymentEndDate] = useState(initialValues.payment_end_date || '');
  const [rentDueDate, setRentDueDate] = useState(initialValues.rent_due_date || '');
  const [paymentMethod, setPaymentMethod] = useState(initialValues.payment_method || 'cash');
  const [referenceNumber, setReferenceNumber] = useState(initialValues.reference_number || '');
  const [notes, setNotes] = useState(initialValues.notes || '');

  // For itemized charges (FR-026)
  const [chargeType, setChargeType] = useState(initialValues.charge_type || 'rent');
  const [chargeAmount, setChargeAmount] = useState(initialValues.charge_amount ? String(initialValues.charge_amount) : '');

  const handleSubmit = () => {
    onSubmit({
      amount_paid: parseInt(amountPaid, 10),
      rent_amount_due: parseInt(rentAmountDue, 10),
      payment_start_date: paymentStartDate,
      payment_end_date: paymentEndDate,
      rent_due_date: rentDueDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      notes,
      charge_type: chargeType,
      charge_amount: chargeAmount ? parseInt(chargeAmount, 10) : undefined,
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
      <Text style={styles.label}>Payment Method</Text>
      <TextInput style={styles.input} value={paymentMethod} onChangeText={setPaymentMethod} />
      <Text style={styles.label}>Reference Number</Text>
      <TextInput style={styles.input} value={referenceNumber} onChangeText={setReferenceNumber} />
      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} />
      <Text style={styles.label}>Charge Type (e.g. rent, electricity, water, garbage, other)</Text>
      <TextInput style={styles.input} value={chargeType} onChangeText={setChargeType} />
      <Text style={styles.label}>Charge Amount</Text>
      <TextInput style={styles.input} value={chargeAmount} onChangeText={setChargeAmount} keyboardType="numeric" />
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
