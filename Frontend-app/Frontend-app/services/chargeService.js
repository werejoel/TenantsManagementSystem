import axios from 'axios';

const API_URL = 'http://YOUR_BACKEND_URL/api/charges/'; // Replace with your backend URL

export const fetchCharges = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add more CRUD functions as needed
