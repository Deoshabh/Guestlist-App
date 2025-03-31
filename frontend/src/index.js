import React from 'react';
<<<<<<< HEAD
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
=======
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
>>>>>>> 65ec56d (Initial)
