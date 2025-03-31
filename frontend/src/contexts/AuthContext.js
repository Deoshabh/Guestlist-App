import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import syncManager from '../utils/syncManager';
import { useNetwork } from './NetworkContext';
import { useToast } from '../components/ToastManager';
import db from '../utils/db';

// Create context
const AuthContext = createContext();

/**
 * Auth provider component
 */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const { isOnline, handleCorsError } = useNetwork();
  const toast = useToast();

  // Load user from IndexedDB if stored
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        if (token) {
          // Try to get user from local database
          const storedUser = await db.users.get({ isCurrentUser: true });
          if (storedUser) {
            setUser(storedUser);
          } else if (isOnline) {
            // If not in local DB but online, fetch from API
            try {
              // Code for fetching user from API would go here
              // If successful, store in IndexedDB and set in state
            } catch (error) {
              console.error('Failed to fetch user data:', error);
              if (error.message === 'Network Error') {
                handleCorsError();
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token, isOnline, handleCorsError]);

  // CRITICAL FIX: Configure axios with proper CORS handling
  useEffect(() => {
    try {
      // Force offline mode for now to bypass CORS issues
      localStorage.setItem('forceOfflineMode', 'true');
      
      // Setup API base URL
      let apiBaseUrl;
      if (window.location.hostname === 'bhaujanvypar.com') {
        apiBaseUrl = 'https://api.bhaujanvypar.com';
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        apiBaseUrl = 'http://localhost:5000';
      } else {
        apiBaseUrl = process.env.REACT_APP_API_URL || '';
      }
      
      console.log('App host:', window.location.hostname);
      console.log('API Base URL:', apiBaseUrl);
      
      // Configure axios
      axios.defaults.baseURL = apiBaseUrl;
      axios.defaults.withCredentials = false;
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      
      // Add CORS headers manually to each request
      axios.interceptors.request.use(request => {
        request.headers['X-Requested-With'] = 'XMLHttpRequest';
        return request;
      });
      
      // Log all responses for debugging
      axios.interceptors.response.use(
        response => {
          console.log('Response received:', response.status);
          return response;
        },
        error => {
          console.error('Axios Error:', error.message);
          return Promise.reject(error);
        }
      );
    } catch (error) {
      console.error('Error configuring axios:', error);
    }
  }, []);

  // Setup auth header for all requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        // IMPORTANT: Only set token if it exists
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  // Update syncManager when token changes
  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem('token', token);
        syncManager.setToken(token);
      } catch (err) {
        console.error('Error in token effect:', err);
      }
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Handle login
  const login = useCallback(async (credentials) => {
    try {
      if (!isOnline) {
        // Special offline login handling
        const users = await db.users.where({ isCurrentUser: true }).toArray();
        if (users.length > 0 && users[0].email === credentials.email) {
          // This is just for demo/testing - in a real app, use secure methods
          setToken('offline-token');
          setUser(users[0]);
          localStorage.setItem('authToken', 'offline-token');
          toast.warning('Logged in with offline mode. Limited functionality available.');
          return true;
        }
        toast.error('Cannot log in while offline unless previously logged in');
        return false;
      }

      // Real login logic would go here with API calls
      // For now just simulating a login
      const dummyToken = 'simulated-token-' + Date.now();
      const dummyUser = {
        id: '1',
        name: credentials.email.split('@')[0],
        email: credentials.email,
        isCurrentUser: true,
      };
      
      // Save to local storage
      localStorage.setItem('authToken', dummyToken);
      setToken(dummyToken);
      setUser(dummyUser);
      
      // Save to IndexedDB for offline access
      await db.users.put(dummyUser);
      
      toast.success('Successfully logged in');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Network Error') {
        handleCorsError();
        toast.error('Login failed due to network issues. Try offline mode.');
      } else {
        toast.error('Login failed: ' + (error.response?.data?.message || error.message));
      }
      
      return false;
    }
  }, [isOnline, toast, handleCorsError]);

  // Handle logout
  const logout = useCallback(async () => {
    try {
      // Clear token from storage
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      
      // Clear current user flag but keep data for offline access
      const currentUser = await db.users.get({ isCurrentUser: true });
      if (currentUser) {
        await db.users.update(currentUser.id, { isCurrentUser: false });
      }
      
      toast.info('You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout error: ' + error.message);
    }
  }, [toast]);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post('/auth/register', userData);
      setLoading(false);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      setLoading(false);
      
      const errorMsg = error.response?.data?.error || error.message || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  // Context value
  const contextValue = {
    token,
    user,
    loading,
    showRegister,
    setShowRegister,
    setToken,
    login,
    logout,
    register,
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
