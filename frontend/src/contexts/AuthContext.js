import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import syncManager from '../utils/syncManager';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showRegister, setShowRegister] = useState(false);

  // Set axios base URL
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'production') {
        axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';
      }
      axios.interceptors.request.use(
        (config) => {
          if (!navigator.onLine && config.method !== 'get') {
            throw new axios.Cancel('Currently offline. Request will be queued.');
          }
          return config;
        },
        (error) => Promise.reject(error)
      );
    } catch (error) {
      console.error('Error setting up axios:', error);
    }
  }, []);

  // Update syncManager when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      syncManager.setToken(token);
      if (navigator.onLine) {
        syncManager.syncPendingActions();
      }
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const logout = () => {
    setToken('');
  };

  const value = {
    token,
    setToken,
    isAuthenticated: !!token,
    showRegister,
    setShowRegister,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
