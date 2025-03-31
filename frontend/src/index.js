import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { GuestProvider } from './contexts/GuestContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { ToastProvider } from './components/ToastManager';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { checkIcons } from './utils/iconGenerator';

// Check for missing icons
try {
  checkIcons().catch(err => console.warn('Icon check failed:', err));
} catch (e) {
  console.warn('Icon check error:', e);
}

// Create root for React 18
const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
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
  </ErrorBoundary>
);

// Register service worker with minimal error handling
try {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log('ServiceWorker registered'),
    onUpdate: (registration) => {
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
    }
  });
} catch (error) {
  console.warn('ServiceWorker registration failed:', error);
}

// Report web vitals
reportWebVitals();
