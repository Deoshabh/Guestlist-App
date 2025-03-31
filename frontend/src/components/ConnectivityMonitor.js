import React, { useEffect } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { useToast } from './ToastManager';

const ConnectivityMonitor = () => {
  const { isOnline, forcedOfflineMode, toggleForcedOfflineMode } = useNetwork();
  const toast = useToast();

  useEffect(() => {
    // Check for CORS errors when mounting
    const checkCorsAccess = async () => {
      try {
        const corsCheck = await fetch('https://api.bhaujanvypar.com/health', { 
          method: 'OPTIONS',
          mode: 'cors'
        });
        console.log('CORS check result:', corsCheck.ok);
      } catch (error) {
        console.warn('CORS preflight check failed:', error);
        // Don't automatically switch to offline mode here
        // that will happen in the API interceptors
      }
    };

    checkCorsAccess();
  }, []);

  return (
    <div className="fixed bottom-0 left-0 z-50 p-2">
      <button 
        onClick={toggleForcedOfflineMode}
        className={`text-xs rounded-full px-3 py-1 flex items-center shadow-lg transition-colors ${
          !isOnline || forcedOfflineMode
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
        }`}
      >
        <span className={`w-2 h-2 rounded-full mr-1 ${
          !isOnline || forcedOfflineMode ? 'bg-red-200' : 'bg-green-200'
        }`}></span>
        {forcedOfflineMode 
          ? 'Offline Mode (Click to Switch)' 
          : isOnline 
            ? 'Online' 
            : 'Offline'}
      </button>
    </div>
  );
};

export default ConnectivityMonitor;
