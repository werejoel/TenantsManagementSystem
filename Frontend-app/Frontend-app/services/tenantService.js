import axios from 'axios';

const API_URL = 'http://localhost:8000/api/tenants/';

// FR-006: Get all tenants
export const fetchTenants = async (token) => {
  try {
    const response = await axios.get(`${API_URL}list/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// FR-005: Add new tenant
export const addTenant = async (tenantData, token) => {
  try {
    const response = await axios.post(`${API_URL}list/`, tenantData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.log('Add Tenant Error:', error.response.data);
    }
    throw error;
  }
};

// FR-007: Update tenant info
export const updateTenant = async (id, tenantData, token) => {
  try {
    const response = await axios.patch(`${API_URL}tenant/${id}/`, tenantData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// FR-008: Deactivate tenant
export const deactivateTenant = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}tenant/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// FR-009: Assign tenant to house/unit
export const assignTenantToHouse = async (id, houseId, token) => {
  try {
    const response = await axios.patch(`${API_URL}tenant/${id}/assign-house/`, { house: houseId }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// FR-010: Tenant views their assigned house/unit
export const getMyHouse = async (token) => {
  try {
    const response = await axios.get(`${API_URL}my-house/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
