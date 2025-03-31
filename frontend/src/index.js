import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Create root and render basic app first
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Simplify rendering to ensure the app at least shows up
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker later
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}
