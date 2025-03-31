import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import Navbar from './components/Navbar';
import ServiceWorkerUpdater from './components/ServiceWorkerUpdater';
import InstallPrompt from './components/InstallPrompt';
import BottomNavbar from './components/BottomNavbar';
import PullToRefreshWrapper from './components/PullToRefreshWrapper';
import FloatingActionButton from './components/FloatingActionButton';
import OfflineIndicator from './components/OfflineIndicator';
import { useToast } from './components/ToastManager';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import db from './utils/db';
import syncManager from './utils/syncManager';
import haptic from './utils/haptic';
import analytics from './utils/analytics';
import { safeGet } from './utils/safeAccess';
import { applyMobilePatches } from './utils/mobileCompatibility';
import serviceWorkerUtil from './utils/serviceWorkerUtil';
import { monitorMobileErrors } from './utils/mobileRecovery';

// Utility to detect mobile devices with more reliability
const detectMobileDevice = () => {
  try {
    // Check via media query
    const isMobileByWidth = window.matchMedia('(max-width: 768px)').matches;
    
    // Check via touch capabilities
    const isTouchDevice = 'ontouchstart' in window || 
                          navigator.maxTouchPoints > 0 || 
                          safeGet(navigator, 'maxTouchPoints', 0) > 0;
    
    // Force desktop view via localStorage setting
    const forceDesktop = localStorage.getItem('forceDesktopView') === 'true';
    
    // Add more detailed logging for mobile detection
    if (process.env.NODE_ENV === 'development') {
      console.log('Mobile detection:', {
        width: window.innerWidth,
        isMobileByWidth,
        isTouchDevice,
        forceDesktop,
        userAgent: navigator.userAgent
      });
    }
    
    return isMobileByWidth && isTouchDevice && !forceDesktop;
  } catch (error) {
    console.error('Error detecting mobile device:', error);
    return false;
  }
};

// Calculate stats from guest data
const calculateStats = (guests) => {
  try {
    if (!Array.isArray(guests)) return { total: 0, invited: 0, pending: 0 };
    const total = guests.filter((g) => !g?.deleted).length;
    const invited = guests.filter((g) => g?.invited && !g?.deleted).length;
    return { total, invited, pending: total - invited };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return { total: 0, invited: 0, pending: 0 };
  }
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
  const [isMobile, setIsMobile] = useState(detectMobileDevice());
  const [networkStatus, setNetworkStatus] = useState({
    type: 'unknown',
    effectiveType: 'unknown',
  });
  const [activeTabIndex, setActiveTabIndex] = useState(0); // For bottom navbar
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : '/api';

  // Set axios base URL
  useEffect(() => {
    try {
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
    } catch (error) {
      console.error('Error setting up axios:', error);
    }
  }, []);

  // Handle dark mode
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', darkMode);
      localStorage.setItem('darkMode', darkMode);
      analytics.event('Settings', 'Toggle Dark Mode', darkMode ? 'On' : 'Off');
    } catch (error) {
      console.error('Error setting dark mode:', error);
    }
  }, [darkMode]);

  // Handle online/offline status with improved reliability
  useEffect(() => {
    const handleOnline = () => {
      try {
        console.log('🌐 Network: Online');
        setIsOnline(true);
        setError(null);
        haptic?.successFeedback();
        fetchGuests();
        analytics.event('Network', 'Status Change', 'Online');
        
        // Sync any pending actions when we come back online
        if (token) {
          syncManager.setToken(token);
          syncManager.syncPendingActions().then(result => {
            if (result && result.synced > 0) {
              toast.success(`Synced ${result.synced} pending changes`);
            }
          });
        }
      } catch (error) {
        console.error('Error handling online status:', error);
      }
    };

    const handleOffline = () => {
      try {
        console.log('🌐 Network: Offline');
        setIsOnline(false);
        haptic?.errorFeedback();
        setError('You are currently offline. Changes will sync when you reconnect.');
        analytics.event('Network', 'Status Change', 'Offline');
      } catch (error) {
        console.error('Error handling offline status:', error);
      }
    };

    const handleNetworkError = () => {
      setHasNetworkError(true);
      // Increment refresh attempts to track persistent issues
      setRefreshAttempts(prev => prev + 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', (e) => {
      // Only catch network-related errors
      if (e.message && (
          e.message.includes('network') || 
          e.message.includes('failed to fetch') ||
          e.message.includes('NetworkError')
        )) {
        handleNetworkError();
      }
    });

    // Auto-recovery for network issues
    if (refreshAttempts > 3 && hasNetworkError) {
      const recovery = setTimeout(() => {
        // Try to clear caches if multiple refresh attempts fail
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(name => {
              caches.delete(name);
            });
          });
        }
        window.location.reload();
      }, 5000);
      
      return () => clearTimeout(recovery);
    }

    // Check connection information if available
    if ('connection' in navigator) {
      try {
        const connection = navigator.connection;
        setNetworkStatus({
          type: connection?.type || 'unknown',
          effectiveType: connection?.effectiveType || 'unknown',
        });
        
        // Listen for connection changes
        const handleConnectionChange = () => {
          try {
            setNetworkStatus({
              type: connection?.type || 'unknown',
              effectiveType: connection?.effectiveType || 'unknown',
            });
            
            // Log connection details
            console.log('Connection type changed:', connection?.type);
            console.log('Effective type:', connection?.effectiveType);
            console.log('Downlink:', connection?.downlink, 'Mbps');
            
            // Adjust fetch strategy based on connection quality
            if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
              toast.info('Slow connection detected. Some features may be limited.');
            }
          } catch (error) {
            console.error('Error updating network status:', error);
          }
        };
        
        connection?.addEventListener('change', handleConnectionChange);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection?.removeEventListener('change', handleConnectionChange);
        };
      } catch (error) {
        console.error('Error setting up connection monitoring:', error);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasNetworkError, refreshAttempts]); // fetchGuests omitted to avoid circular dependency

  // Update mobile state on resize with debouncing
  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newIsMobile = detectMobileDevice();
        if (newIsMobile !== isMobile) {
          console.log(`📱 Viewport: ${newIsMobile ? 'Mobile' : 'Desktop'}`);
          setIsMobile(newIsMobile);
        }
      }, 250);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile]);

  // Sync manager setup
  useEffect(() => {
    if (token && isOnline) {
      syncManager.setToken(token);
      syncManager.syncPendingActions();
    }
  }, [token, isOnline]);

  // Enable sourcemaps for debugging in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('debug')) {
        console.log('Debug mode enabled - loading sourcemaps');
        const script = document.createElement('script');
        script.src = '/enableSourceMaps.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

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
  }, []); // Removed isOnline dependency

  // Fetch guests with improved error handling
  const fetchGuests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    
    try {
      if (navigator.onLine) {
        console.log('📡 Fetching guests from server...');
        try {
          const res = await axios.get(`${API_BASE_URL}/guests`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000 // 15 second timeout for mobile networks
          });
          setGuests(res.data);
          
          // Save to IndexedDB for offline access
          await db.saveGuests(res.data).catch((dbErr) =>
            console.warn('Failed to save to local DB:', dbErr)
          );
          
          try {
            // Fetch stats separately for performance
            const statsRes = await axios.get(`${API_BASE_URL}/guests/stats`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000 // Shorter timeout for stats
            });
            setStats(statsRes.data);
          } catch (statsErr) {
            console.error('Error fetching stats, using calculated:', statsErr);
            setStats(calculateStats(res.data));
          }
        } catch (apiErr) {
          console.error('API Error:', apiErr);
          
          // Fall back to cached data if available
          const cachedGuests = await db.getGuests();
          if (cachedGuests && cachedGuests.length > 0) {
            console.log('Using cached guest data...');
            setGuests(cachedGuests);
            setStats(calculateStats(cachedGuests));
            setError('Could not update from server. Showing cached data.');
          } else {
            setError(apiErr.response?.data?.error || 'Failed to load guests. Please try again.');
          }
        }
      } else {
        // Offline mode - use cached data from IndexedDB
        console.log('🔄 Loading guests from cache...');
        const cachedGuests = await db.getGuests();
        if (cachedGuests && cachedGuests.length > 0) {
          setGuests(cachedGuests);
          setStats(calculateStats(cachedGuests));
          setError('You are offline. Showing cached guest data.');
        } else {
          setError('You are offline and no cached data is available.');
        }
      }
    } catch (err) {
      console.error('Error in fetchGuests:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  // Load guests when token changes
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
      return () => clearTimeout(timer);
    }
  }, []);

  // Apply mobile patches
  useEffect(() => {
    try {
      if (isMobile) {
        console.log('📱 Applying mobile optimizations...');
        applyMobilePatches();
      }
    } catch (error) {
      console.error('Error applying mobile patches:', error);
    }
  }, [isMobile]);

  // Monitor for mobile errors
  useEffect(() => {
    if (isMobile) {
      monitorMobileErrors();
    }
  }, [isMobile]);

  // Quick actions for mobile FAB (Floating Action Button)
  const quickActions = useMemo(
    () => [
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
          try {
            haptic.mediumFeedback();
            // Set active tab to the form tab (index 0)
            setActiveTabIndex(0);
            
            // Focus on the first input after a delay
            setTimeout(() => {
              const addForm = document.querySelector('.guest-form');
              if (addForm) {
                addForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const firstInput = addForm.querySelector('input');
                if (firstInput) firstInput.focus();
              }
            }, 300);
          } catch (error) {
            console.error('Error with Add Guest action:', error);
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
    ],
    [isOnline, guests, API_BASE_URL, haptic, toast]
  );

  // Bottom navbar items
  const bottomNavItems = useMemo(() => [
    {
      label: 'Add',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      label: 'List',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Stats',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: darkMode ? 'Light' : 'Dark',
      icon: darkMode ? (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    }
  ], [darkMode]);

  // Handle bottom navbar clicks
  const handleBottomNavClick = (index) => {
    setActiveTabIndex(index);
    
    // Handle different tabs
    switch(index) {
      case 0: // Add
        document.querySelector('.guest-form')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 1: // List
        document.querySelector('.guest-list')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 3: // Settings
        // You could show a settings modal here
        break;
      case 4: // Toggle Dark Mode
        toggleDarkMode();
        break;
      default:
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Add a visible indicator for forced desktop view
  const isDesktopForced = localStorage.getItem('forceDesktopView') === 'true' && 
                          (window.innerWidth <= 768 || navigator.maxTouchPoints > 0);

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
      <ErrorBoundary>
        {/* Forced Desktop Mode Indicator */}
        {isDesktopForced && (
          <div className="fixed top-0 left-0 right=0 bg-amber-500 text-amber-900 text-sm py-1 px-4 text-center z-50 flex items-center justify-center">
            <span>Desktop View Active</span>
            <button 
              onClick={() => {
                localStorage.removeItem('forceDesktopView');
                window.location.reload();
              }}
              className="ml-2 px-2 bg-white text-xs rounded-full"
            >
              Return to Mobile
            </button>
          </div>
        )}
        
        {/* Offline indicator */}
        <OfflineIndicator />
        
        <PullToRefreshWrapper onRefresh={fetchGuests} disabled={!isMobile} isLoading={loading}>
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

            {hasNetworkError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 dark:bg-red-900 dark:text-red-200 rounded-md sticky top-0 z-50">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">Network error detected. Some features may not work.</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 bg-red-200 dark:bg-red-800 px-4 py-2 rounded self-end text-sm"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            )}
            
            {/* Stats cards */}
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
        </PullToRefreshWrapper>
        
        {/* Mobile-specific components */}
        {isMobile && (
          <>
            <FloatingActionButton actions={quickActions} />
            <BottomNavbar 
              items={bottomNavItems} 
              activeIdx={activeTabIndex} 
              onItemClick={handleBottomNavClick} 
            />
          </>
        )}
        
        {/* PWA components */}
        <ServiceWorkerUpdater />
        <InstallPrompt />
      </ErrorBoundary>
    </div>
  );
}

export default App;