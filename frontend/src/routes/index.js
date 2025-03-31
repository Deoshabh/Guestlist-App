import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import GuestListPage from './pages/GuestListPage';
import GuestFormPage from './pages/GuestFormPage';
import GuestGroupsPage from './pages/GuestGroupsPage';
import WhatsAppTemplatesPage from './pages/WhatsAppTemplatesPage';
import { ToastProvider } from './components/ToastManager';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/guests" element={<GuestListPage />} />
          <Route path="/guests/add" element={<GuestFormPage />} />
          <Route path="/guests/edit/:id" element={<GuestFormPage />} />
          <Route path="/groups" element={<GuestGroupsPage />} />
          <Route path="/whatsapp-templates" element={<WhatsAppTemplatesPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  </React.StrictMode>
);

// Register service worker for offline capabilities
serviceWorkerRegistration.register();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();