import axios from 'axios';

const API_URL = 'http://localhost:8000/api/charges/'; //backend URL and port

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
