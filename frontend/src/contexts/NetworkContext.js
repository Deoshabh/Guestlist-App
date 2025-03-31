import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../components/ToastManager';
import haptic from '../utils/haptic';
import analytics from '../utils/analytics';
import syncManager from '../utils/syncManager';

const NetworkContext = createContext();

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({ children, apiBaseUrl = '/api' }) {
  const toast = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(
    navigator.onLine ? Date.now() : null
  );
  const [error, setError] = useState(null);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [networkStatus, setNetworkStatus] = useState({
    type: 'unknown',
    effectiveType: 'unknown',
    saveDataMode: false,
  });
  
  const [hasConnectivity, setHasConnectivity] = useState(navigator.onLine);
  const checkInterval = useRef(null);
  const listeners = useRef([]);

  const checkConnection = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const checkUrl = `${apiBaseUrl}/health?_=${Date.now()}`;
      
      const response = await fetch(checkUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      const newHasConnectivity = response.ok;
      
      if (hasConnectivity !== newHasConnectivity) {
        setHasConnectivity(newHasConnectivity);
        notifyListeners();
      }
      
      if (response.ok) {
        if (!isOnline) {
          setIsOnline(true);
          setLastOnlineTime(Date.now());
          setError(null);
          toast.success('Connection restored');
          haptic.successFeedback();
        }
      } else {
        setIsOnline(false);
        toast.error('Connection check failed');
        haptic.errorFeedback();
      }
      
      return newHasConnectivity;
    } catch (error) {
      console.error('Connection check error:', error);
      
      if (hasConnectivity) {
        setHasConnectivity(false);
        setIsOnline(false);
        notifyListeners();
      }
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, apiBaseUrl, hasConnectivity, isOnline, toast]);

  const addListener = useCallback((callback) => {
    if (typeof callback === 'function' && !listeners.current.includes(callback)) {
      listeners.current.push(callback);
    }
    return () => removeListener(callback);
  }, []);

  const removeListener = useCallback((callback) => {
    listeners.current = listeners.current.filter(listener => listener !== callback);
  }, []);

  const notifyListeners = useCallback(() => {
    const status = getStatus();
    
    listeners.current.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }, []);

  const getStatus = useCallback(() => {
    return {
      isOnline,
      hasConnectivity,
      lastCheck: lastOnlineTime,
      lastOnlineTime,
      networkType: networkStatus.type,
      effectiveType: networkStatus.effectiveType,
      saveDataMode: networkStatus.saveDataMode,
      isSlowConnection: ['slow-2g', '2g', '3g'].includes(networkStatus.effectiveType),
      isFastConnection: networkStatus.effectiveType === '4g',
      isWifi: networkStatus.type === 'wifi',
      isCellular: ['cellular', 'mobile'].includes(networkStatus.type),
    };
  }, [isOnline, hasConnectivity, lastOnlineTime, networkStatus]);

  useEffect(() => {
    const startConnectivityChecks = () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
      
      checkInterval.current = setInterval(() => {
        checkConnection();
      }, 30000);
      
      checkConnection();
    };
    
    const stopConnectivityChecks = () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    };
    
    startConnectivityChecks();
    
    return () => {
      stopConnectivityChecks();
    };
  }, [checkConnection]);

  useEffect(() => {
    const handleOnline = () => {
      try {
        console.log('🌐 Network: Online');
        setIsOnline(true);
        setLastOnlineTime(Date.now());
        setError(null);
        haptic?.successFeedback();
        analytics.event('Network', 'Status Change', 'Online');
        
        checkConnection();
        
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
        setHasConnectivity(false);
        haptic?.errorFeedback();
        setError('You are currently offline. Changes will sync when you reconnect.');
        analytics.event('Network', 'Status Change', 'Offline');
        notifyListeners();
      } catch (error) {
        console.error('Error handling offline status:', error);
      }
    };

    const handleNetworkError = () => {
      setHasNetworkError(true);
      setRefreshAttempts(prev => prev + 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', (e) => {
      if (e.message && (
          e.message.includes('network') || 
          e.message.includes('failed to fetch') ||
          e.message.includes('NetworkError')
        )) {
        handleNetworkError();
      }
    });

    if (refreshAttempts > 3 && hasNetworkError) {
      const recovery = setTimeout(() => {
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

    if ('connection' in navigator) {
      try {
        const connection = navigator.connection;
        
        const updateConnectionInfo = () => {
          try {
            setNetworkStatus({
              type: connection?.type || 'unknown',
              effectiveType: connection?.effectiveType || 'unknown',
              saveDataMode: connection?.saveData || false,
            });
            
            console.log('Connection type changed:', connection?.type);
            console.log('Effective type:', connection?.effectiveType);
            console.log('Downlink:', connection?.downlink, 'Mbps');
            console.log('Save data:', connection?.saveData ? 'Enabled' : 'Disabled');
            
            if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
              toast.info('Slow connection detected. Some features may be limited.');
            }
            
            notifyListeners();
          } catch (error) {
            console.error('Error updating network status:', error);
          }
        };
        
        updateConnectionInfo();
        
        connection?.addEventListener('change', updateConnectionInfo);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection?.removeEventListener('change', updateConnectionInfo);
        };
      } catch (error) {
        console.error('Error setting up connection monitoring:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasNetworkError, refreshAttempts, toast, checkConnection, notifyListeners]);

  const value = {
    isOnline,
    isConnecting,
    lastOnlineTime,
    hasConnectivity,
    checkConnection,
    error,
    setError,
    hasNetworkError,
    networkStatus,
    API_BASE_URL: apiBaseUrl,
    isSlowConnection: ['slow-2g', '2g', '3g'].includes(networkStatus.effectiveType),
    isFastConnection: networkStatus.effectiveType === '4g',
    isWifi: networkStatus.type === 'wifi',
    isCellular: ['cellular', 'mobile'].includes(networkStatus.type),
    saveDataMode: networkStatus.saveDataMode,
    addNetworkListener: addListener,
    removeNetworkListener: removeListener,
    getNetworkStatus: getStatus
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}
