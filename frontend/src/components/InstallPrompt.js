import React, { useState, useEffect } from 'react';
import haptic from '../utils/haptic';
import serviceWorkerUtil from '../utils/serviceWorkerUtil';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  // Handle the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default behavior
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e);
      
      // Check if we should show the prompt
      checkShouldShowPrompt().then(shouldShow => {
        if (shouldShow) {
          setShowPrompt(true);
        }
      });
    };
    
    // Check if we're already in installed mode
    if (serviceWorkerUtil.isAppInstalled()) {
      return;
    }
    
    // Add the event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Check if we should show the install prompt
  const checkShouldShowPrompt = async () => {
    try {
      // Don't show if already installed
      if (serviceWorkerUtil.isAppInstalled()) {
        return false;
      }
      
      // Don't show if we've recently dismissed the prompt
      const lastDismissed = localStorage.getItem('installPromptDismissed');
      if (lastDismissed) {
        const dismissedTime = parseInt(lastDismissed, 10);
        const now = Date.now();
        
        // If dismissed less than 7 days ago, don't show again
        if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
      }
      
      // Only show after the user has spent some time on the site
      const firstVisit = localStorage.getItem('firstVisit');
      if (!firstVisit) {
        localStorage.setItem('firstVisit', Date.now().toString());
        return false;
      } else {
        const visitTime = parseInt(firstVisit, 10);
        const now = Date.now();
        
        // If first visit was less than 5 minutes ago, don't show yet
        if (now - visitTime < 5 * 60 * 1000) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking whether to show install prompt:', error);
      return false;
    }
  };
  
  // Handle the install button click
  const handleInstall = async () => {
    try {
      // Provide haptic feedback
      haptic.mediumFeedback();
      
      // Hide the prompt
      setShowPrompt(false);
      
      // Show the install prompt
      if (deferredPrompt) {
        deferredPrompt.prompt();
        
        // Wait for the user's choice
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        // Clear the deferred prompt
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };
  
  // Handle the dismiss button click
  const handleDismiss = () => {
    haptic.lightFeedback();
    
    // Remember that the user dismissed the prompt
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    
    // Hide the prompt
    setShowPrompt(false);
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-0 inset-x-0 px-4 pb-safe-bottom z-40 animate-slideUp">
      <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Add to Home Screen
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Install this app on your device for a better experience with offline access.
            </p>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 p-2 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
