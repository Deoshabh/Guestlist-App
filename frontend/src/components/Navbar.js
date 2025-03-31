import React, { useState } from 'react';
import ViewModeToggle from './ViewModeToggle';
import haptic from '../utils/haptic';

const Navbar = ({ 
  darkMode = false,
  toggleDarkMode = () => {},
  logout = () => {},
  isAuthenticated = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    try {
      haptic.lightFeedback();
      setIsMenuOpen(!isMenuOpen);
    } catch (err) {
      console.error('Error toggling menu:', err);
      // Still toggle menu even if haptic fails
      setIsMenuOpen(!isMenuOpen);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm mb-6 rounded-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Guest List Manager</h1>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-3">
            {/* View mode toggle */}
            <ViewModeToggle className="mr-2" />
            
            <button
              onClick={toggleDarkMode}
              className="px-3 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {darkMode ? (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Light Mode
                </span>
              ) : (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark Mode
                </span>
              )}
            </button>
            {isAuthenticated && (
              <button 
                onClick={logout}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </span>
              </button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {/* Add ViewModeToggle to mobile header */}
            <ViewModeToggle className="mr-2" />
            
            <button
              onClick={toggleMenu}
              className="outline-none mobile-menu-button"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-500 dark:text-gray-200 hover:text-primary"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} px-2 pb-3 space-y-2`}>
        <button 
<<<<<<< HEAD
          onClick={() => {
            toggleDarkMode();
            toggleMenu();
          }}
          className="block w-full px-4 py-3 text-left rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
=======
          onClick={toggleDarkMode}
          className="block w-full px-4 py-2 text-left rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
>>>>>>> parent of 64b458f (New UI)
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        {isAuthenticated && (
          <button 
<<<<<<< HEAD
            onClick={() => {
              logout();
              toggleMenu();
            }}
            className="block w-full px-4 py-3 text-left rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors touch-manipulation"
=======
            onClick={logout}
            className="block w-full px-4 py-2 text-left rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors"
>>>>>>> parent of 64b458f (New UI)
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
