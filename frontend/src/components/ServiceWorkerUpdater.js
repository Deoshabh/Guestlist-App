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
  
  useEffect(() => {
    // Check if we're in a PWA environment
    const isPWA = serviceWorkerUtil.isAppInstalled();
    
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      // Setup a listener for when the service worker controlling this page changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // When the service worker is updated and takes control
        if (updateReady) {
          window.location.reload();
        }
      });
      
      // Also listen for messages from the service worker
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 mx-auto max-w-md border border-blue-100 dark:border-blue-900 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white text-base">
                Update Available
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                A new version is available. Update now to get the latest features and fixes.
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleUpdate}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerUpdater;
