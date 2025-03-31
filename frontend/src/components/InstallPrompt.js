import React, { useState, useEffect } from 'react';
import haptic from '../utils/haptic';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    // Check if on iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
    
    // Only show the prompt once per day
    const lastPrompt = localStorage.getItem('lastInstallPrompt');
    const showInstallPrompt = !lastPrompt || (Date.now() - parseInt(lastPrompt, 10)) > 86400000; // 24 hours
    
    // Only show install prompt if not already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
                       
    if (isInstalled) {
      return; // Already installed, no need to show prompt
    }
    
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Show the install prompt banner if conditions are met
      if (showInstallPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };
    
    // Add event listener for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Show iOS specific instructions
    if (isIOSDevice && showInstallPrompt) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    haptic.mediumFeedback();
    
    // Hide the prompt
    setShowPrompt(false);
    
    // Update the last prompt time
    localStorage.setItem('lastInstallPrompt', Date.now().toString());
    
    if (!deferredPrompt) {
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
  };
  
  const handleClose = () => {
    haptic.lightFeedback();
    setShowPrompt(false);
    localStorage.setItem('lastInstallPrompt', Date.now().toString());
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-16 inset-x-0 px-4 z-40 animate-slideUp">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 mx-auto max-w-md border border-blue-100 dark:border-blue-900">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white text-base">
                Install Guest Manager
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {isIOS 
                  ? "Tap the share icon and 'Add to Home Screen' to install" 
                  : "Install this app on your device for faster access and offline use"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {!isIOS && (
          <div className="mt-4">
            <button
              onClick={handleInstallClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Install Now
            </button>
          </div>
        )}
        
        {isIOS && (
          <div className="mt-4 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Tap the share icon below</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
