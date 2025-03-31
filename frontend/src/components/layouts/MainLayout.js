import React, { useEffect } from 'react';
import Navbar from '../Navbar';
import BottomNavbar from '../BottomNavbar';
import FloatingActionButton from '../FloatingActionButton';
import OfflineIndicator from '../OfflineIndicator';
import PullToRefreshWrapper from '../PullToRefreshWrapper';
import ServiceWorkerUpdater from '../ServiceWorkerUpdater';
import InstallPrompt from '../InstallPrompt';
import { useUI } from '../../contexts/UIContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGuests } from '../../contexts/GuestContext';

const MainLayout = ({ 
  children, 
  fetchGuests = () => {}, 
  loading = false,
  error = null,
  logout = () => {}
}) => {
  const { isOnline, hasNetworkError } = useNetwork();
  const { darkMode, isMobile, isDesktopForced } = useUI();
  const [quickActions, bottomNavItems, activeTabIndex, handleBottomNavClick] = useNavigationItems();

  // Remove any references to errorRecovery.js if they exist
  // Implement basic error handling if needed
  useEffect(() => {
    if (error && typeof error === 'string') {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className={`App ${darkMode ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6`}>
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
            isAuthenticated={true}
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
          
          {/* Main content */}
          {children}
          
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
    </div>
  );
};

export default MainLayout;
