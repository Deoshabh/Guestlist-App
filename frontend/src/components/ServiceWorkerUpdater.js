import React, { useState, useEffect } from 'react';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';
import haptic from '../utils/haptic';

/**
 * ServiceWorkerUpdater handles notifying the user about new versions
 * and provides a way to update to the latest version
 */
const ServiceWorkerUpdater = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // Register the service worker with custom update handlers
    serviceWorkerRegistration.register({
      onUpdate: registration => {
        setWaitingWorker(registration.waiting);
        setShowReload(true);
        // Provide haptic feedback to notify users on mobile
        haptic.mediumFeedback();
      },
      onSuccess: registration => {
        console.log('Service Worker registered successfully');
      }
    });
  }, []);

  const reloadPage = () => {
    if (waitingWorker) {
      // Send a message to activate the waiting service worker
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Provide feedback and reload
      haptic.strongFeedback();
      
      // Close all open windows and reload
      window.location.reload(true);
      
      setShowReload(false);
    }
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 px-4 z-50">
      <div className="bg-blue-600 text-white py-3 px-4 rounded-lg shadow-xl flex items-center justify-between animate-fadeIn">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p>New version available!</p>
        </div>
        <button 
          onClick={reloadPage}
          className="ml-4 px-3 py-1 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
        >
          Update Now
        </button>
      </div>
    </div>
  );
};

export default ServiceWorkerUpdater;
