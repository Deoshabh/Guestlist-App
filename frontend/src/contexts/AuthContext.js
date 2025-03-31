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
  const [loginError, setLoginError] = useState(null);

  // Configure axios with the correct backend URL
  useEffect(() => {
    try {
      // Set the base URL from environment or use a relative path
      const apiBaseUrl = process.env.REACT_APP_API_URL || '';
      
      // For deployments where the API is on a different domain
      if (window.location.hostname === 'bhaujanvypar.com') {
        axios.defaults.baseURL = 'https://api.bhaujanvypar.com';
      } else {
        axios.defaults.baseURL = apiBaseUrl;
      }
      
      console.log('API Base URL set to:', axios.defaults.baseURL);
      
      // Ensure we have proper content type for all requests
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      
      // Add withCredentials for CORS with credentials
      axios.defaults.withCredentials = true;
    } catch (error) {
      console.error('Error setting axios defaults:', error);
    }
  }, []);

  // Setup auth header for all requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

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

  // Login function with better error handling
  const login = useCallback(async (credentials) => {
    setLoginError(null);
    
    // For development testing and offline mode - provide a backup login
    if (!navigator.onLine || process.env.NODE_ENV === 'development') {
      console.log('Using offline/development login mode');
      const mockToken = 'mock-jwt-token-' + Date.now();
      setToken(mockToken);
      setUser({ 
        id: 'user-1', 
        username: credentials.username || 'user@example.com', 
        name: 'Test User'
      });
      return { success: true, token: mockToken };
    }
    
    try {
      console.log('Attempting login with API at:', axios.defaults.baseURL);
      
      // Use /auth/login instead of /api/auth/login since we set the base URL already
      const response = await axios.post('/auth/login', credentials);
      
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData || { username: credentials.username });
      
      return { success: true, token: newToken, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle specific error scenarios
      if (error.response) {
        // Server returned an error
        setLoginError(error.response.data.error || 'Login failed. Please check your credentials.');
      } else if (error.request) {
        // Request was made but no response
        setLoginError('Could not connect to the server. Please check your internet connection.');
      } else {
        // Something else went wrong
        setLoginError('An error occurred during login. Please try again.');
      }
      
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      // Use /auth/register instead of /api/auth/register since we set the base URL already
      const response = await axios.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
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
    loginError,
    setLoginError,
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
