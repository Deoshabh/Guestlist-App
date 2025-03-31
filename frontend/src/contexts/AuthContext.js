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
  const [isLoading, setIsLoading] = useState(false);

  // Configure axios with the correct backend URL
  useEffect(() => {
    try {
      // Determine API URL based on environment
      let apiBaseUrl;
      if (window.location.hostname === 'bhaujanvypar.com') {
        apiBaseUrl = 'https://api.bhaujanvypar.com';
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        apiBaseUrl = 'http://localhost:5000';
      } else {
        apiBaseUrl = process.env.REACT_APP_API_URL || '';
      }
      
      console.log('Setting API Base URL to:', apiBaseUrl);
      axios.defaults.baseURL = apiBaseUrl;
      
      // Disable withCredentials because we're using Bearer token
      axios.defaults.withCredentials = false;
      
      // Set common headers
      axios.defaults.headers.common['Content-Type'] = 'application/json';
    } catch (error) {
      console.error('Error configuring axios:', error);
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
      try {
        localStorage.setItem('token', token);
        syncManager.setToken(token);
        if (navigator.onLine) {
          syncManager.syncPendingActions().catch(err => 
            console.warn('Background sync failed:', err)
          );
        }
      } catch (err) {
        console.error('Error in token effect:', err);
      }
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Login function with error handling and fallback to offline mode
  const login = useCallback(async (credentials) => {
    setLoginError(null);
    setIsLoading(true);
    
    try {
      // For development testing and offline mode
      if (!navigator.onLine || process.env.NODE_ENV === 'development') {
        console.log('Using offline/development login mode');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const mockToken = 'mock-jwt-token-' + Date.now();
        setToken(mockToken);
        setUser({ 
          id: 'user-1', 
          username: credentials.username || 'user@example.com', 
          name: 'Test User'
        });
        setIsLoading(false);
        return { success: true, token: mockToken };
      }
      
      // URL troubleshooting logs
      console.log('Login attempt details:', {
        baseURL: axios.defaults.baseURL,
        endpoint: '/auth/login',
        fullUrl: `${axios.defaults.baseURL}/auth/login`,
        credentials: { ...credentials, password: '******' }
      });
      
      // Production login
      const response = await axios.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData || { username: credentials.username });
      setIsLoading(false);
      
      return { success: true, token: newToken, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage;
      
      if (error.response) {
        // Server returned an error
        errorMessage = error.response.data.error || 'Login failed. Please check your credentials.';
        console.log('Server returned error:', { 
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Request made but no response (network issue)
        errorMessage = 'Could not connect to the server. Please check your internet connection.';
        console.log('No response from server:', error.request);
        
        // Fall back to offline mode in production
        if (process.env.NODE_ENV === 'production') {
          console.log('Falling back to offline mode in production');
          const mockToken = 'offline-jwt-token-' + Date.now();
          setToken(mockToken);
          setUser({ 
            id: 'offline-user', 
            username: credentials.username || 'user@example.com',
            name: 'Offline User', 
            isOfflineLogin: true
          });
          setIsLoading(false);
          return { 
            success: true, 
            token: mockToken,
            isOfflineLogin: true,
            message: 'Logged in offline mode. Changes will sync when connection is restored.'
          };
        }
      } else {
        // Something else went wrong
        errorMessage = 'An error occurred during login. Please try again.';
      }
      
      setLoginError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
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
      setIsLoading(true);
      const response = await axios.post('/auth/register', userData);
      setIsLoading(false);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      setIsLoading(false);
      
      const errorMsg = error.response?.data?.error || error.message || 'Registration failed';
      return { success: false, error: errorMsg };
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
    isLoading
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
