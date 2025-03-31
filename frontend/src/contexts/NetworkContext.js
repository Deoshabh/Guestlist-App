import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/ToastManager';

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [forcedOfflineMode, setForcedOfflineMode] = useState(
    localStorage.getItem('forceOfflineMode') === 'true'
  );
  const [corsError, setCorsError] = useState(false);
  const toast = useToast();

  // Define the API base URL with a fallback
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.bhaujanvypar.com';

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!forcedOfflineMode && !corsError) {
        toast.success('You are back online');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Limited functionality available.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, forcedOfflineMode, corsError]);

  // Function to toggle forced offline mode
  const toggleForcedOfflineMode = useCallback(() => {
    const newValue = !forcedOfflineMode;
    setForcedOfflineMode(newValue);
    localStorage.setItem('forceOfflineMode', newValue);
    
    // Show CORS warning message
    const corsWarning = document.getElementById('cors-warning');
    if (corsWarning) {
      corsWarning.style.display = newValue ? 'block' : 'none';
    }
    
    if (newValue) {
      toast.info('App switched to offline mode. Some features limited.');
    } else {
      toast.info('App switched to online mode. Attempting to sync...');
    }
  }, [forcedOfflineMode, toast]);

  // Handle CORS errors
  const handleCorsError = useCallback(() => {
    setCorsError(true);
    
    // Only toggle to offline mode if not already in that mode
    if (!forcedOfflineMode) {
      toggleForcedOfflineMode();
      toast.error('CORS error detected. Switched to offline mode.', 5000);
    }
  }, [forcedOfflineMode, toggleForcedOfflineMode, toast]);

  // Values to expose through context
  const value = {
    isOnline: isOnline && !forcedOfflineMode && !corsError,
    forcedOfflineMode,
    toggleForcedOfflineMode,
    handleCorsError,
    API_BASE_URL,
    corsError,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export default NetworkContext;
