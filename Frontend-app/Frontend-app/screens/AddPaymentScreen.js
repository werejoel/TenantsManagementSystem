import React, { useContext } from 'react';
import { View, Alert } from 'react-native';
import PaymentForm from '../components/PaymentForm';
import { AuthContext } from '../context/AuthContext';
import { addPayment } from '../services/paymentService';

const AddPaymentScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const handleAddPayment = async (paymentData) => {
    try {
      await addPayment(paymentData, user?.token);
      Alert.alert('Success', 'Payment recorded successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  return (
    <View>
      <PaymentForm onSubmit={handleAddPayment} />
    </View>
  );
};

export default AddPaymentScreen;
