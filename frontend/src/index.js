import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { GuestProvider } from './contexts/GuestContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { ToastProvider } from './contexts/ToastContext';

// Create root and render app - simplified to avoid analytics errors
const root = createRoot(document.getElementById('root'));
root.render(
  // Removed StrictMode as it causes double initialization which can worsen errors
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

// Register service worker with minimal error handling
try {
  serviceWorkerRegistration.register({
    onSuccess: (registration) => {
      console.log('ServiceWorker registered');
    },
    onUpdate: () => {
      console.log('ServiceWorker updated');
    }
  });
} catch (error) {
  console.warn('ServiceWorker registration failed:', error);
}

// Simple reportWebVitals that doesn't depend on analytics
reportWebVitals(console.log);
