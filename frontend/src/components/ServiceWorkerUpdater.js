/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import serviceWorkerUtil from '../utils/serviceWorkerUtil';
import haptic from '../utils/haptic';

/**
 * ServiceWorkerUpdater handles notifying the user about new versions
 * and provides a way to update to the latest version
 */
const ServiceWorkerUpdater = () => {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  
  // Check if we're running in PWA mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true;
  
  useEffect(() => {
    // Register for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setShowUpdateBanner(true);
        }
      });
    }
    
    // Check for updates periodically
    const checkForUpdates = async () => {
      try {
        // Only show update banner in PWA mode or if offline mode is supported
        if ((isPWA || navigator.onLine === false) && 'serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration && registration.waiting) {
            // There's a new service worker waiting to take control
            setShowUpdateBanner(true);
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };
    
    // Check on component mount
    checkForUpdates();
    
    // Check periodically (every 30 minutes)
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isPWA]);
  
  // Watch for page load events after an update is triggered
  useEffect(() => {
    if (updateReady) {
      const handlePageLoad = () => {
        // Use setTimeout to let the DOM settle
        setTimeout(() => {
          setShowUpdateBanner(false);
          setUpdateReady(false);
        }, 1000);
      };
      
      window.addEventListener('load', handlePageLoad);
      
      return () => {
        window.removeEventListener('load', handlePageLoad);
      };
    }
  }, [updateReady]);
  
  const handleUpdate = async () => {
    try {
      haptic.mediumFeedback();
      
      // Mark that we're ready for the update
      setUpdateReady(true);
      
      // Get the waiting service worker
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.waiting) {
        // Send message to the waiting service worker to activate itself
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      // Fall back to a hard refresh
      serviceWorkerUtil.hardReload();
    }
  };
  
  const handleClose = () => {
    haptic.lightFeedback();
    setShowUpdateBanner(false);
  };
  
  if (!showUpdateBanner) return null;
  
  return (
    <div className="fixed bottom-0 inset-x-0 px-4 pb-safe-bottom z-50 animate-slideUp">
      <div className="bg-blue-600 text-white rounded-t-md p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
            <div>
              <p className="font-medium">App update available</p>
              <p className="text-sm text-blue-200">Refresh to get the latest version</p>
            </div>
          </div>
          <div className="flex">
            <button 
              onClick={handleClose}
              className="text-white mr-2 p-2 rounded-full hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button 
              onClick={handleUpdate}
              className="bg-white text-blue-600 py-1 px-3 rounded-md font-medium hover:bg-blue-50"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerUpdater;
