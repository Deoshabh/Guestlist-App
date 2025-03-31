import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import rippleEffect from './utils/rippleEffect';
import keyboardManager from './utils/keyboardManager';
import { ToastProvider } from './components/ToastManager';

// Initialize ripple effects when app loads
rippleEffect.initRippleEffects();

// Initialize keyboard optimizations for mobile
keyboardManager.scrollToFocusedInput();
keyboardManager.adjustForKeyboard('#root');

// Create root for React 18
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality with enhanced feedback
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // You can trigger a notification here if there's an update
    console.log('New version available!');
    
    if (registration && registration.waiting) {
      // New content is available, let's refresh to use it
      if (window.confirm('New content is available! Reload to update?')) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// Setting up performance monitoring for mobile optimization
reportWebVitals(metric => {
  if (metric.name === 'FCP' || metric.name === 'LCP' || metric.name === 'CLS') {
    console.log(metric);
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics
      // window.gtag('event', name, {
      //   value: Math.round(name === 'CLS' ? metric.value * 1000 : metric.value),
      //   metric_id: metric.id,
      //   metric_name: metric.name,
      //   metric_value_delta: metric.delta,
      // });
    }
  }
});
