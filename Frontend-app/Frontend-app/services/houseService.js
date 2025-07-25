import axios from 'axios';

const API_URL = 'http://localhost:8000/api/houses/';
// Update house info
export const updateHouse = async (id, houseData, token) => {
  try {
    const response = await axios.patch(`${API_URL}${id}/`, houseData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a house
export const deleteHouse = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}${id}/delete/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Set occupancy status
export const setHouseOccupancy = async (id, is_occupied, token) => {
  try {
    const response = await axios.patch(
      `${API_URL}${id}/occupancy/`,
      { is_occupied },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

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
