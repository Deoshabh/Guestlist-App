import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { GuestProvider } from './contexts/GuestContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { ToastProvider } from './components/ToastManager';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Create root for React 18
const root = createRoot(document.getElementById('root'));

// Handle global errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

root.render(
  <ErrorBoundary showDetails={true}>
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

// Register service worker with simplified error handling
try {
  serviceWorkerRegistration.register();
} catch (error) {
  console.warn('ServiceWorker registration failed:', error);
}
