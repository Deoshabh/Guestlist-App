import React, { useState, useEffect } from 'react';
import connectivityManager from '../utils/connectivity';

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasInternetConnection, setHasInternetConnection] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  
  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      
      // We might be "online" according to the browser but without actual internet access
      // Delay hiding the indicator until we verify connectivity
      connectivityManager.checkConnectivity().then(hasConnectivity => {
        setHasInternetConnection(hasConnectivity);
        
        // Only hide the indicator if we actually have connectivity
        if (hasConnectivity) {
          setTimeout(() => setShowIndicator(false), 2000);
        }
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setHasInternetConnection(false);
      setShowIndicator(true);
    };
    
    // Listen for connectivity status from our manager
    const connectivityListener = (status) => {
      setHasInternetConnection(status.hasConnectivity);
      setShowIndicator(!status.hasConnectivity);
    };
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsubscribe = connectivityManager.addListener(connectivityListener);
    
    // Initial status check
    setIsOffline(!navigator.onLine);
    setShowIndicator(!navigator.onLine);
    connectivityManager.checkConnectivity().then(hasConnectivity => {
      setHasInternetConnection(hasConnectivity);
      setShowIndicator(!hasConnectivity);
    });
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);
  
  if (!showIndicator) return null;
  
  return (
    <div className={`
      fixed top-0 inset-x-0 z-50 py-2 px-4 text-center text-sm 
      transition-all duration-300 transform
      ${showIndicator ? 'translate-y-0' : '-translate-y-full'}
      ${isOffline ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-yellow-900'}
    `}>
      {isOffline ? (
        <>
          <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
          You&apos;re offline. Changes will sync when reconnected.
        </>
      ) : !hasInternetConnection ? (
        <>
          <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mr-2 animate-pulse"></span>
          Limited connectivity. Some features may not work properly.
        </>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;
