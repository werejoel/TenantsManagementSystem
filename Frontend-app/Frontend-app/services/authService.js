import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/accounts/'; // Registration
const TOKEN_URL = 'http://127.0.0.1:8000/api/token/'; // JWT login
const REFRESH_URL = 'http://127.0.0.1:8000/api/token/refresh/'; // JWT refresh
const DASHBOARD_URL = 'http://127.0.0.1:8000/'; // Dashboard

export const register = async (name, email, password, role) => {
  return axios.post(`${API_URL}register/`, { username: name, email, password, role });
};

export const login = async (username, password) => {
  return axios.post(TOKEN_URL, { username, password });
};

export const refreshToken = async (refresh) => {
  return axios.post(REFRESH_URL, { refresh });
};

export const getDashboard = async (token) => {
  return axios.get(DASHBOARD_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
