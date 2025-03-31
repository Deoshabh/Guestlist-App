import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
<<<<<<< HEAD
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { GuestProvider } from './contexts/GuestContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { ToastProvider } from './contexts/ToastContext';
import { checkIcons } from './utils/iconGenerator';

// Check for missing icons
checkIcons().catch(err => console.warn('Icon check failed:', err));

// Create root and render app
=======
import './App.css';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Create root for React 18
>>>>>>> parent of 64b458f (New UI)
const root = createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <BrowserRouter>
      <NetworkProvider>
        <AuthProvider>
          <UIProvider>
            <GuestProvider>
              <App />
            </GuestProvider>
          </UIProvider>
        </AuthProvider>
      </NetworkProvider>
    </BrowserRouter>
  </ToastProvider>
);

<<<<<<< HEAD
// Register service worker with minimal error handling
try {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log('ServiceWorker registered'),
    onUpdate: () => console.log('ServiceWorker updated')
  });
} catch (error) {
  console.warn('ServiceWorker registration failed:', error);
}

// Simple reportWebVitals
reportWebVitals(console.log);
=======
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
>>>>>>> parent of 64b458f (New UI)
