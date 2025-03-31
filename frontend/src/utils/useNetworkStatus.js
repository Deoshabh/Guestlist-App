import { useState, useEffect } from 'react';

/**
 * A hook that provides network status information
 * @returns {Object} Network status with online state and connection info
 */
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState('unknown');
  const [saveDataMode, setSaveDataMode] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const conn = navigator.connection;
        setConnectionType(conn.type || 'unknown');
        setEffectiveType(conn.effectiveType || 'unknown'); 
        setSaveDataMode(conn.saveData || false);
      }
    };

    // Set initial values
    updateOnlineStatus();
    updateConnectionInfo();

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
    }

    // Clean up
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    effectiveType,
    saveDataMode,
    // Derived properties
    isSlowConnection: ['slow-2g', '2g', '3g'].includes(effectiveType),
    isFastConnection: effectiveType === '4g',
    isWifi: connectionType === 'wifi',
    isCellular: ['cellular', 'mobile'].includes(connectionType),
  };
};

export default useNetworkStatus;
