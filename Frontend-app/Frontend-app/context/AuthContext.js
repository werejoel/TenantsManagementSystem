import React, { createContext, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store user info and JWT

  // userData
  const login = (userData) => {
    // If userData has access token, store it as user.token
    if (userData && userData.access) {
      let userInfo = userData.user ? { ...userData.user } : {};
      // Try to extract role from userData (for custom backend response)
      if (userData.role) {
        userInfo.role = userData.role;
      } else if (userData.data && userData.data.role) {
        userInfo.role = userData.data.role;
      } else if (!userInfo.role) {
        userInfo.role = 'user';
      }
      setUser({
        ...userInfo,
        token: userData.access,
        refresh: userData.refresh,
      });
    } else if (userData) {
      // If userData is a plain object, ensure role is present
      let userInfo = { ...userData };
      if (userData.role) {
        userInfo.role = userData.role;
      } else if (userData.data && userData.data.role) {
        userInfo.role = userData.data.role;
      } else if (!userInfo.role) {
        userInfo.role = 'user';
      }
      setUser(userInfo);
    } else {
      setUser(userData);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const API_URL = 'http://127.0.0.1:8000/api/accounts/'; // Registration
const TOKEN_URL = 'http://127.0.0.1:8000/api/token/'; // JWT login
const DASHBOARD_URL = 'http://127.0.0.1:8000/'; // Dashboard

export const register = async (name, email, password, role) => {
  return axios.post(`${API_URL}register/`, { username: name, email, password, role });
};

export const login = async (username, password) => {
  return axios.post(TOKEN_URL, { username, password });
};

export const getDashboard = async (token) => {
  return axios.get(DASHBOARD_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
