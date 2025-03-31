import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '../components/ToastManager';
import haptic from '../utils/haptic';

const NetworkContext = createContext();

export const NetworkProvider = ({ children, apiBaseUrl = '/api' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState(
    navigator.onLine ? Date.now() : null
  );
  const toast = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(Date.now());
      toast.success('You are back online');
      haptic.successFeedback();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may not work properly.');
      haptic.errorFeedback();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Function to attempt reconnection
  const checkConnection = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (!isOnline) {
          setIsOnline(true);
          setLastOnlineTime(Date.now());
          toast.success('Connection restored');
          haptic.successFeedback();
        }
      } else {
        setIsOnline(false);
        toast.error('Connection check failed');
        haptic.errorFeedback();
      }
    } catch (error) {
      console.error('Connection check error:', error);
      setIsOnline(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <NetworkContext.Provider 
      value={{ 
        isOnline, 
        isConnecting, 
        lastOnlineTime,
        checkConnection,
        API_BASE_URL: apiBaseUrl 
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
