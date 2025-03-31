import React, { useState, useEffect, useCallback } from 'react';
import haptic from '../utils/haptic';

const FloatingActionButton = ({ actions = [] }) => {
  // Ensure actions is always an array
  const safeActions = Array.isArray(actions) ? actions : [];
  
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Close FAB menu when clicking outside
  const handleClickOutside = useCallback((event) => {
    // Check if the click was outside the FAB
    if (isOpen && !event.target.closest('.floating-action-button')) {
      setIsOpen(false);
    }
  }, [isOpen]);
  
  // Auto-close the FAB when scrolling
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Always show when near the top
    if (currentScrollY < 50) {
      setIsVisible(true);
    } else if (currentScrollY > lastScrollY + 30) {
      // Hide when scrolling down significantly
      setIsVisible(false);
      setIsOpen(false);
    } else if (lastScrollY > currentScrollY + 30) {
      // Show when scrolling up significantly
      setIsVisible(true);
    }
    
    // Update last scroll position
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);
  
  // Handle action click with safety for mobile
  const handleActionClick = (action) => {
    try {
      // Close the FAB first
      setIsOpen(false);
      
      // Provide haptic feedback if possible
      if (haptic && typeof haptic.mediumFeedback === 'function') {
        haptic.mediumFeedback();
      }
      
      // Execute the action with a small delay
      setTimeout(() => {
        if (action && typeof action.onClick === 'function') {
          action.onClick();
        }
      }, 10);
    } catch (err) {
      console.error('Error handling action click:', err);
    }
  };
  
  // Set up event listeners
  useEffect(() => {
    try {
      // Add passive scroll listener for better performance
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    } catch (err) {
      console.error('Error setting up FAB event listeners:', err);
    }
  }, [handleScroll, handleClickOutside]);
  
  // Don't render if no actions
  if (safeActions.length === 0) {
    return null;
  }
  
  return (
    <div 
      className={`floating-action-button fixed right-4 transition-all duration-300 ease-in-out z-30 ${
        isVisible ? 'transform-none' : 'translate-y-24'
      }`}
      style={{ 
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))'
      }}
    >
      {/* Action menu - only shown when open */}
      {isOpen && (
        <div className="flex flex-col items-end space-y-3 mb-3 animate-fadeIn">
          {safeActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className="flex items-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg px-4 py-2 text-sm transition-transform hover:scale-105 transform active:scale-95 touch-manipulation"
              aria-label={action.label}
            >
              <span className="mr-2">{action.label}</span>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                {action.icon}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Main FAB button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          haptic.lightFeedback();
        }}
        className="h-14 w-14 rounded-full bg-primary shadow-xl flex items-center justify-center text-white transform hover:scale-105 active:scale-95 focus:outline-none transition-all touch-manipulation"
        aria-label={isOpen ? 'Close actions' : 'Open actions'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionButton;
