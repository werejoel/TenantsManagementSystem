import axios from 'axios';

const API_URL = 'http://YOUR_BACKEND_URL/api/payments/'; // Replace with your backend URL

export const fetchPayments = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const addPayment = async (paymentData, token) => {
  try {
    const response = await axios.post(API_URL, paymentData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
