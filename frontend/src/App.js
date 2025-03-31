import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import Navbar from './components/Navbar';
import ServiceWorkerUpdater from './components/ServiceWorkerUpdater';
import InstallPrompt from './components/InstallPrompt';
import BottomNavbar from './components/BottomNavbar';
import PullToRefresh from './components/PullToRefresh';
import FloatingActionButton from './components/FloatingActionButton';
import { useToast } from './components/ToastManager';
import './App.css';
import db from './utils/db';
import syncManager from './utils/syncManager';
import haptic from './utils/haptic';

// Utility to detect mobile devices
const isMobileDevice = () => {
  return (
    window.innerWidth <= 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
};

// Calculate stats from guest data
const calculateStats = (guests) => {
  const total = guests.filter((g) => !g.deleted).length;
  const invited = guests.filter((g) => g.invited && !g.deleted).length;
  return { total, invited, pending: total - invited };
};

function App() {
  const toast = useToast();
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showRegister, setShowRegister] = useState(false);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total: 0, invited: 0, pending: 0 });
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  // eslint-disable-next-line no-unused-vars
  const [networkStatus, setNetworkStatus] = useState({
    type: 'unknown',
    effectiveType: 'unknown',
  });

  const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : '/api';

  // Set axios base URL
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';
    }
    axios.interceptors.request.use(
      (config) => {
        if (!navigator.onLine && config.method !== 'get') {
          throw new axios.Cancel('Currently offline. Request will be queued.');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }, []);

  // Handle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      haptic.successFeedback();
      fetchGuests();
    };
    const handleOffline = () => {
      setIsOnline(false);
      haptic.errorFeedback();
      setError('You are currently offline. Changes will sync when you reconnect.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      const connection = navigator.connection;
      setNetworkStatus({
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
      });
      connection.addEventListener('change', () => {
        setNetworkStatus({
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
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
  }, []); // Note: fetchGuests omitted from deps to avoid circular dependency

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync manager setup
  useEffect(() => {
    if (token && isOnline) {
      syncManager.setToken(token);
      syncManager.syncPendingActions();
    }
  }, [token]); // Only trigger on token change

  // Fetch guests
  const fetchGuests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        const res = await axios.get(`${API_BASE_URL}/guests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGuests(res.data);
        await db.saveGuests(res.data).catch((dbErr) =>
          console.warn('Failed to save to local DB:', dbErr)
        );
        const statsRes = await axios.get(`${API_BASE_URL}/guests/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(statsRes.data);
      } else {
        const localGuests = await db.getAllGuests();
        setGuests(localGuests);
        setStats(calculateStats(localGuests));
        setError('You are offline. Showing locally saved data.');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      if (!navigator.onLine) {
        try {
          const localGuests = await db.getAllGuests();
          if (localGuests.length > 0) {
            setGuests(localGuests);
            setStats(calculateStats(localGuests));
            setError('You are offline. Showing locally saved data.');
          } else {
            setError('No local data available. Connect to sync guests.');
          }
        } catch (dbErr) {
          setError('Could not load offline data.');
          setGuests([]);
          setStats({ total: 0, invited: 0, pending: 0 });
        }
      } else {
        setError('Could not connect to server.');
        setGuests([]);
        setStats({ total: 0, invited: 0, pending: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  // Fetch guests on token change
  useEffect(() => {
    if (token) {
      fetchGuests();
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token, fetchGuests]);

  // Utility functions
  const toggleDarkMode = () => {
    haptic.lightFeedback();
    setDarkMode((prev) => !prev);
  };

  const logout = () => {
    haptic.mediumFeedback();
    setToken('');
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => Notification.requestPermission(), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Enhanced quick actions for the FAB with better mobile experience
  const quickActions = [
    {
      label: 'Add Guest',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      ),
      onClick: () => {
        const addForm = document.querySelector('.guest-form');
        if (addForm) {
          addForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Focus on the first input for better UX
          setTimeout(() => {
            const firstInput = addForm.querySelector('input');
            if (firstInput) firstInput.focus();
          }, 500);
        }
      },
    },
    {
      label: 'Export CSV',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      ),
      onClick: () => {
        if (isOnline && guests.length > 0) {
          window.open(`${API_BASE_URL}/guests/export`, '_blank');
          haptic.mediumFeedback();
          toast.success('Exporting to CSV');
        } else {
          setError('Export is only available when online with guests');
          haptic.errorFeedback();
          toast.error('Export is only available when online');
        }
      },
    },
    {
      label: 'Go to Top',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      ),
      onClick: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        haptic.lightFeedback();
      },
    },
  ];

  // Conditional rendering
  if (!token && showRegister) {
    return <Register setToken={setToken} setShowRegister={setShowRegister} />;
  }
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
    <div
      className={`App ${darkMode ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6`}
    >
      <PullToRefresh
        onRefresh={() => {
          haptic.mediumFeedback(); 
          return fetchGuests().then(() => {
            toast.success('Data refreshed');
            return Promise.resolve();
          });
        }}
        disabled={!isMobile}
      >
        <div className={`max-w-6xl mx-auto ${isMobile ? 'pb-24' : 'pb-6'}`}>
          <Navbar
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            isAuthenticated={!!token}
            logout={logout}
          />
          {!isOnline && (
            <div
              className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 dark:bg-orange-900 dark:text-orange-200 rounded-md animate-fadeIn"
              role="alert"
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>Offline Mode - Changes will sync when you reconnect</p>
              </div>
            </div>
          )}
          {error && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 dark:bg-red-900 dark:text-red-200 rounded-md"
              role="alert"
            >
              <p>{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between card-hover">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Guests
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-500 dark:text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between card-hover">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Invited
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.invited}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-500 dark:text-green-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between card-hover">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pending}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-500 dark:text-yellow-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
          {loading ? (
            <div
              className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center"
              role="status"
            >
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
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
          {isOnline && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Add to home screen for offline access
              </p>
            </div>
          )}
        </div>
        
        {/* Mobile-only components */}
        {isMobile && (
          <>
            <BottomNavbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <FloatingActionButton actions={quickActions} />
          </>
        )}
        <ServiceWorkerUpdater />
        <InstallPrompt />
      </PullToRefresh>
    </div>
  );
}

export default App;