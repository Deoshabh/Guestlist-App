import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Create root for React 18
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Always register the service worker in production for PWA support
if (process.env.NODE_ENV === 'production') {
  // Register the service worker with custom configuration
  serviceWorkerRegistration.register({
    onUpdate: registration => {
      // Show notification for updates
      const waitingServiceWorker = registration.waiting;
      
      if (waitingServiceWorker) {
        waitingServiceWorker.addEventListener("statechange", event => {
          if (event.target.state === "activated") {
            window.location.reload();
          }
        });
        waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
      }
    },
    onSuccess: registration => {
      console.log('Service worker registered successfully');
      
      // Request permission for notifications on successful registration
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  });
} else {
  // During development, you can opt-in to service worker features
  serviceWorkerRegistration.unregister();
}
