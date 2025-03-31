import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import haptic from '../../utils/haptic';

/**
 * BottomNavigationBar Component
 * Provides a mobile-friendly navigation bar for primary actions
 */
const BottomNavigationBar = ({ onOpenActionMenu }) => {
  const location = useLocation();
  
  const handleAction = (callback) => {
    haptic.lightFeedback();
    if (callback) callback();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {/* Home Button */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-1/4 h-full touch-manipulation ${location.pathname === '/' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => haptic.lightFeedback()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>

        {/* Guest List Button */}
        <Link 
          to="/guests" 
          className={`flex flex-col items-center justify-center w-1/4 h-full touch-manipulation ${location.pathname.startsWith('/guests') ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => haptic.lightFeedback()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-xs mt-1">Guests</span>
        </Link>

        {/* Add Guest Button (Quick Action) */}
        <button 
          onClick={() => handleAction(() => window.location.href = '/guests/add')}
          className="flex flex-col items-center justify-center w-1/4 h-full touch-manipulation text-primary"
        >
          <div className="bg-primary rounded-full p-3 -mt-8 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="text-xs mt-1">Add</span>
        </button>

        {/* More Options Button */}
        <button 
          onClick={() => handleAction(onOpenActionMenu)}
          className="flex flex-col items-center justify-center w-1/4 h-full touch-manipulation text-gray-500 dark:text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigationBar;
