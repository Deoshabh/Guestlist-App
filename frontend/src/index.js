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
import { checkIcons } from './utils/iconGenerator';

// Check for missing icons
checkIcons().catch(err => console.warn('Icon check failed:', err));

// Create root and render app
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
