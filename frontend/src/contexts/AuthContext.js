import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import syncManager from '../utils/syncManager';

// Create context
const AuthContext = createContext();

/**
 * Auth provider component
 */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
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

  // Stub login function
  const login = useCallback(async (credentials) => {
    console.warn('[STUB] Login called with:', credentials);
    const mockToken = 'mock-jwt-token-' + Date.now();
    setToken(mockToken);
    setUser({ id: 'user-1', username: credentials.username || 'user@example.com' });
    return { token: mockToken };
  }, []);

  // Stub logout function
  const logout = useCallback(() => {
    console.warn('[STUB] Logout called');
    setToken(null);
    setUser(null);
  }, []);

  // Stub register function
  const register = useCallback(async (userData) => {
    console.warn('[STUB] Register called with:', userData);
    return { success: true };
  }, []);

  // Context value
  const contextValue = {
    token,
    setToken,
    user,
    setUser,
    login,
    logout,
    register,
    showRegister,
    setShowRegister,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
