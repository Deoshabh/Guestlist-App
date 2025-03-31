import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ToastProvider } from './components/ToastManager';
import ErrorBoundary from './components/ErrorBoundary';
import analytics from './utils/analytics';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Initialize analytics safely
analytics.init();

// Register service worker with custom callbacks
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('ServiceWorker registration successful with scope: ', registration.scope);
  },
  onUpdate: (registration) => {
    console.log('ServiceWorker update available. New content will be used when all tabs are closed.');
    // You can show a notification to the user here
  },
  onOffline: () => {
    console.log('App is running in offline mode');
  }
});

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
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
