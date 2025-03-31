import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const NetworkContext = createContext();

/**
 * Network provider component
 */
export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNetworkError, setHasNetworkError] = useState(false);

  // Set up event listeners for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasNetworkError(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Context value
  const contextValue = {
    isOnline,
    hasNetworkError,
    setHasNetworkError,
    API_BASE_URL: '/api'
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

/**
 * Hook to use the network context
 */
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export default NetworkContext;
