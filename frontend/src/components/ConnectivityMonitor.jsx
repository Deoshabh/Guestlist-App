import React, { useState, useEffect } from 'react';
import { useToast } from './ToastManager';
import haptic from '../utils/haptic';

/**
 * Component that monitors and displays network connectivity status
 */
export default function ConnectivityMonitor() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(false);
  const toast = useToast();
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(true);
      // Hide the notification after 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
      toast.success('You are back online');
      haptic.successFeedback();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
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
  
  if (!isVisible) return null;
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 animate-slideDown ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
      <div className="container mx-auto px-4 py-2 text-white text-center font-medium">
        {isOnline ? (
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Connected to network
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            You are offline. Some features are limited.
          </div>
        )}
      </div>
    </div>
  );
}
