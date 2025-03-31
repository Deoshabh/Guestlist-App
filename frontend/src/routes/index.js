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

// Create a connection status detector component
const ConnectionStatusProvider = ({ children }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    // Function to handle online status change
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        console.log('Application is now online');
      } else {
        console.log('Application is now offline');
      }
    };

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Provide connection status to the application
  return (
    <React.Fragment>
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-yellow-500 text-white text-center py-1 z-50">
          You are offline. Some features may be limited.
        </div>
      )}
      {children}
    </React.Fragment>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <ConnectionStatusProvider>
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
      </ConnectionStatusProvider>
    </ToastProvider>
  </React.StrictMode>
);

// Register service worker for offline capabilities
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('Service Worker registration successful with scope:', registration.scope);
  },
  onUpdate: (registration) => {
    console.log('New content is available; please refresh.');
  },
  onOffline: () => {
    console.log('App is running in offline mode');
  }
});

// Existing service worker code can be removed since we're using the registration above
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