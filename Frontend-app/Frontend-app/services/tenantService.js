import axios from 'axios';

const API_URL = 'http://YOUR_BACKEND_URL/api/tenants/'; // Replace with your backend URL

export const fetchTenants = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const addTenant = async (tenantData, token) => {
  try {
    const response = await axios.post(API_URL, tenantData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
