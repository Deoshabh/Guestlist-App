import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import db from '../utils/db';
import { useToast } from '../components/ToastManager';

// Create context
const AuthContext = createContext();

/**
 * Auth provider component
 */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const toast = useToast();

  // Load user from IndexedDB on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        if (token) {
          const storedUser = await db.users.get({ isCurrentUser: true });
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Handle login
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      
      // Generate a simulated token and user for demo purposes
      const dummyToken = 'demo-token-' + Date.now();
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
      toast.error('Login failed: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Handle logout
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      toast.info('You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [toast]);

  // Simple registration function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      
      // Create dummy user
      const dummyUser = {
        id: Date.now().toString(),
        ...userData,
        isCurrentUser: true,
      };
      
      // Save to IndexedDB
      await db.users.put(dummyUser);
      
      // Set token and user
      const dummyToken = 'demo-token-' + Date.now();
      localStorage.setItem('authToken', dummyToken);
      setToken(dummyToken);
      setUser(dummyUser);
      
      return { success: true, data: { user: dummyUser, token: dummyToken } };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
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
