import React, { useState, useEffect } from 'react';
import { toggleDesktopView } from '../utils/mobileCompatibility';

/**
 * ViewModeToggle - Allows users to switch between mobile and desktop views
 */
const ViewModeToggle = ({ className = '' }) => {
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  
  useEffect(() => {
    const desktopForced = localStorage.getItem('forceDesktopView') === 'true';
    setIsDesktopMode(desktopForced);
  }, []);
  
  // Only show on mobile devices
  if (window.innerWidth > 768 && !navigator?.maxTouchPoints) {
    return null;
  }
  
  const handleToggle = () => {
    const newMode = toggleDesktopView();
    setIsDesktopMode(newMode);
  };
  
  return (
    <button
      onClick={handleToggle}
      className={`flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm ${className}`}
      aria-label={isDesktopMode ? "Switch to mobile view" : "Switch to desktop view"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {isDesktopMode ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        )}
      </svg>
      <span>{isDesktopMode ? "Mobile View" : "Desktop View"}</span>
    </button>
  );
};

export default ViewModeToggle;
