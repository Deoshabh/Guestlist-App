import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '../components/ToastManager';
import haptic from '../utils/haptic';
import analytics from '../utils/analytics';
import syncManager from '../utils/syncManager';

const NetworkContext = createContext();

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({ children }) {
  const toast = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState(null);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [networkStatus, setNetworkStatus] = useState({
    type: 'unknown',
    effectiveType: 'unknown',
  });

  // Handle online/offline status with improved reliability
  useEffect(() => {
    const handleOnline = () => {
      try {
        console.log('🌐 Network: Online');
        setIsOnline(true);
        setError(null);
        haptic?.successFeedback();
        analytics.event('Network', 'Status Change', 'Online');
        
        // Sync any pending actions when we come back online
        syncManager.syncPendingActions().then(result => {
          if (result && result.synced > 0) {
            toast.success(`Synced ${result.synced} pending changes`);
          }
        });
      } catch (error) {
        console.error('Error handling online status:', error);
      }
    };

    const handleOffline = () => {
      try {
        console.log('🌐 Network: Offline');
        setIsOnline(false);
        haptic?.errorFeedback();
        setError('You are currently offline. Changes will sync when you reconnect.');
        analytics.event('Network', 'Status Change', 'Offline');
      } catch (error) {
        console.error('Error handling offline status:', error);
      }
    };

    const handleNetworkError = () => {
      setHasNetworkError(true);
      // Increment refresh attempts to track persistent issues
      setRefreshAttempts(prev => prev + 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', (e) => {
      // Only catch network-related errors
      if (e.message && (
          e.message.includes('network') || 
          e.message.includes('failed to fetch') ||
          e.message.includes('NetworkError')
        )) {
        handleNetworkError();
      }
    });

    // Auto-recovery for network issues
    if (refreshAttempts > 3 && hasNetworkError) {
      const recovery = setTimeout(() => {
        // Try to clear caches if multiple refresh attempts fail
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(name => {
              caches.delete(name);
            });
          });
        }
        window.location.reload();
      }, 5000);
      
      return () => clearTimeout(recovery);
    }

    // Check connection information if available
    if ('connection' in navigator) {
      try {
        const connection = navigator.connection;
        setNetworkStatus({
          type: connection?.type || 'unknown',
          effectiveType: connection?.effectiveType || 'unknown',
        });
        
        // Listen for connection changes
        const handleConnectionChange = () => {
          try {
            setNetworkStatus({
              type: connection?.type || 'unknown',
              effectiveType: connection?.effectiveType || 'unknown',
            });
            
            // Log connection details
            console.log('Connection type changed:', connection?.type);
            console.log('Effective type:', connection?.effectiveType);
            console.log('Downlink:', connection?.downlink, 'Mbps');
            
            // Adjust fetch strategy based on connection quality
            if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
              toast.info('Slow connection detected. Some features may be limited.');
            }
          } catch (error) {
            console.error('Error updating network status:', error);
          }
        };
        
        connection?.addEventListener('change', handleConnectionChange);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection?.removeEventListener('change', handleConnectionChange);
        };
      } catch (error) {
        console.error('Error setting up connection monitoring:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasNetworkError, refreshAttempts, toast]);

  const value = {
    isOnline,
    error,
    setError,
    hasNetworkError,
    networkStatus,
    API_BASE_URL: process.env.NODE_ENV === 'production' ? '' : '/api'
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}
