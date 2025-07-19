import axios from 'axios';

const API_URL = 'http://YOUR_BACKEND_URL/api/houses/'; // Replace with your backend URL

export const fetchHouses = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const addHouse = async (houseData, token) => {
  try {
    const response = await axios.post(API_URL, houseData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
