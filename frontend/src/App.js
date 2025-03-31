import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
<<<<<<< HEAD
import AppProviders from './components/AppProviders';
import MainLayout from './components/layouts/MainLayout';
import HomePage from './pages/HomePage';
import WhatsAppTemplatesPage from './pages/WhatsAppTemplatesPage';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';
import { useNetwork } from './contexts/NetworkContext';
import { useGuests } from './contexts/GuestContext';
import { getBottomNavItems, getQuickActions } from './utils/navItems';
=======
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import Navbar from './components/Navbar';
import ServiceWorkerUpdater from './components/ServiceWorkerUpdater';
import InstallPrompt from './components/InstallPrompt';
import './App.css';
import db from './utils/db';
import syncManager from './utils/syncManager';
>>>>>>> parent of 64b458f (New UI)
import haptic from './utils/haptic';
import { useToast } from './components/ToastManager';
import './App.css';
import analytics from './utils/analytics';
import ConnectivityMonitor from './components/ConnectivityMonitor';

<<<<<<< HEAD
function AppContent() {
  const { token, showRegister, setShowRegister, setToken } = useAuth();
  const { darkMode, setActiveTabIndex } = useUI();
  const { isOnline, API_BASE_URL } = useNetwork();
  const { guests } = useGuests();
  const toast = useToast();

  // Handle analytics initialization
  useEffect(() => {
    try {
      const analyticsId = process.env.REACT_APP_GA_ID || 'G-03XW3FWG7L';
      if (!localStorage.getItem('analytics_opt_out')) {
        analytics.init(analyticsId).catch((err) => {
          console.warn('Analytics initialization error (non-critical):', err);
        });
      }
    } catch (error) {
      console.warn('Failed to initialize analytics:', error);
    }
  }, []);

  // Enable sourcemaps for debugging in production
=======
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showRegister, setShowRegister] = useState(false);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total: 0, invited: 0, pending: 0 });
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // eslint-disable-next-line no-unused-vars
  const [networkStatus, setNetworkStatus] = useState({
    type: 'unknown',
    effectiveType: 'unknown'
  });

  // Use API base URL with environment awareness
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '' 
    : '/api';

  // Set default axios base URL
>>>>>>> parent of 64b458f (New UI)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('debug')) {
        console.log('Debug mode enabled');
      }
    }
<<<<<<< HEAD
  }, []);

  // Request notification permission
  useEffect(() => {
    if (('Notification' in window) && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        try {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              console.log('Notification permission granted');
            }
          });
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }, 5000); // Wait 5 seconds before asking
=======

    // Add request interceptor to handle offline requests
    axios.interceptors.request.use(
      config => {
        if (!navigator.onLine) {
          // For GET requests, we'll attempt to serve from cache via the service worker
          // For non-GET requests, we need to store them for later processing
          if (config.method !== 'get') {
            throw new axios.Cancel('Currently offline. Request will be queued for later.');
          }
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }, []);

  // Set dark mode class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Setup online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      haptic.successFeedback();
      // Trigger a fetch when coming back online
      fetchGuests();
    };

    const handleOffline = () => {
      setIsOnline(false);
      haptic.errorFeedback();
      // Show a friendly offline message
      setError('You are currently offline. Changes will be saved locally and synced when you reconnect.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial network status if Network Information API is available
    if ('connection' in navigator) {
      const connection = navigator.connection;
      setNetworkStatus({
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown'
      });

      // Listen for network type changes
      connection.addEventListener('change', () => {
        setNetworkStatus({
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown'
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', () => {});
      }
    };
  }, []);

  // Initialize sync manager with token
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) {
      syncManager.setToken(token);
      if (navigator.onLine) {
        syncManager.syncPendingActions();
      }
    }
  }, [token, isOnline]);

  // Use useCallback to create a stable reference to fetchGuests
  const fetchGuests = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (navigator.onLine) {
        // When online, fetch from API
        const res = await axios.get(`${API_BASE_URL}/guests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGuests(res.data);
        
        // Also store in local DB for offline use
        try {
          await db.saveGuests(res.data);
        } catch (dbErr) {
          console.warn('Failed to save guests to local DB:', dbErr);
        }
        
        const statsRes = await axios.get(`${API_BASE_URL}/guests/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsRes.data);
      } else {
        // When offline, get from local DB
        try {
          const localGuests = await db.getAllGuests();
          setGuests(localGuests);
          
          // Calculate stats manually
          const total = localGuests.filter(g => !g.deleted).length;
          const invited = localGuests.filter(g => g.invited && !g.deleted).length;
          setStats({
            total,
            invited,
            pending: total - invited
          });
          
          setError('You are offline. Showing locally saved data.');
        } catch (dbErr) {
          console.error('Error fetching from local DB:', dbErr);
          setError('Could not load offline data. Please check your connection.');
          setGuests([]);
          setStats({ total: 0, invited: 0, pending: 0 });
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      
      if (!navigator.onLine) {
        try {
          // Try to load from IndexedDB if we're offline
          const localGuests = await db.getAllGuests();
          if (localGuests.length > 0) {
            setGuests(localGuests);
            // Calculate stats manually
            const total = localGuests.filter(g => !g.deleted).length;
            const invited = localGuests.filter(g => g.invited && !g.deleted).length;
            setStats({
              total,
              invited,
              pending: total - invited
            });
            setError('You are offline. Showing locally saved data.');
          } else {
            setError('No local data available. Connect to the internet to load guests.');
          }
        } catch (dbErr) {
          setError('Could not load offline data. Please check your connection.');
          setGuests([]);
          setStats({ total: 0, invited: 0, pending: 0 });
        }
      } else {
        setError('Could not connect to server. Please make sure the backend is running.');
        setGuests([]);
        setStats({ total: 0, invited: 0, pending: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) {
      fetchGuests();
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token, fetchGuests]);

  const toggleDarkMode = () => {
    haptic.lightFeedback();
    setDarkMode(!darkMode);
  };
  
  const logout = () => {
    haptic.mediumFeedback();
    setToken('');
  };

  // Request notification permission for syncing
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Wait a moment before asking for permission
      const timer = setTimeout(() => {
        Notification.requestPermission();
      }, 3000);
      
>>>>>>> parent of 64b458f (New UI)
      return () => clearTimeout(timer);
    }
  }, []);

<<<<<<< HEAD
  // Bottom navbar items
  const bottomNavItems = getBottomNavItems(darkMode);

  // Quick actions for mobile FAB (Floating Action Button)
  const quickActions = getQuickActions(
    isOnline, 
    guests, 
    API_BASE_URL, 
    haptic, 
    toast, 
    setActiveTabIndex
  );

  // Conditional rendering for authentication
  if (!token && showRegister) {
    return <Register setToken={setToken} setShowRegister={setShowRegister} />;
  }
  
=======
  // Handle Register component
  if (!token && showRegister) {
    return <Register setToken={setToken} setShowRegister={setShowRegister} />;
  }

  // Handle Login
>>>>>>> parent of 64b458f (New UI)
  if (!token) {
    return (
      <Login 
        setToken={setToken} 
        showRegister={showRegister} 
        setShowRegister={setShowRegister} 
      />
    );
  }

  return (
<<<<<<< HEAD
    <Router>
      <MainLayout 
        quickActions={quickActions} 
        bottomNavItems={bottomNavItems}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/whatsapp-templates" element={<WhatsAppTemplatesPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

function App() {
  return (
    <AppProviders>
      <div className="App">
        <ConnectivityMonitor />
        <AppContent />
      </div>
    </AppProviders>
=======
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} isAuthenticated={!!token} logout={logout} />
        
        {/* Network status indicator */}
        {!isOnline && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 dark:bg-orange-900 dark:text-orange-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Offline Mode - Changes will sync when you reconnect</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 dark:bg-red-900 dark:text-red-200 rounded-md">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Guests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Invited</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.invited}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        ) : (
          <>
            <GuestForm 
              token={token} 
              onGuestAdded={fetchGuests} 
              apiBaseUrl={API_BASE_URL}
              isOnline={isOnline}
            />
            <GuestList 
              token={token} 
              guests={guests} 
              onUpdate={fetchGuests} 
              apiBaseUrl={API_BASE_URL}
              isOnline={isOnline}
            />
          </>
        )}

        {/* Install prompt - only show on specific conditions */}
        {isOnline && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add to home screen for offline access
            </p>
          </div>
        )}
      </div>
      
      {/* Add the ServiceWorkerUpdater component */}
      <ServiceWorkerUpdater />
      
      {/* Add the InstallPrompt component */}
      <InstallPrompt />
    </div>
>>>>>>> parent of 64b458f (New UI)
  );
}

export default App;