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
import analytics from './utils/analytics';

// Initialize analytics safely
analytics.init();

// Register service worker with custom callbacks
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('ServiceWorker registration successful with scope: ', registration.scope);
  },
  onUpdate: () => {
    console.log('ServiceWorker update available. New content will be used when all tabs are closed.');
    // You can show a notification to the user here
  },
  onOffline: () => {
    console.log('App is running in offline mode');
  }
});

// Create root and render app
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NetworkProvider>
        <AuthProvider>
          <UIProvider>
            <GuestProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </GuestProvider>
          </UIProvider>
        </AuthProvider>
      </NetworkProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals((metric) => {
  // Safely log web vitals to analytics
  try {
    analytics.event('Web Vitals', metric.name, metric.value.toString());
  } catch (error) {
    console.log('Failed to report web vitals');
  }
});
