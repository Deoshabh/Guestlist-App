import React, { useState } from 'react';
import haptic from '../utils/haptic';

const FloatingActionButton = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => {
    haptic.mediumFeedback();
    setIsOpen(!isOpen);
  };
  
  const handleAction = (action) => {
    // Call the action handler
    if (typeof action.onClick === 'function') {
      action.onClick();
    }
    
    // Close the menu
    setIsOpen(false);
  };
  
  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Backdrop for when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Action buttons */}
      <div className="relative">
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3 mb-2 animate-slideUp">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className="flex items-center bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 transform hover:scale-105 touch-manipulation"
                aria-label={action.label}
              >
                <span className="mr-2 p-1 rounded-full bg-primary/10 dark:bg-primary/20">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Main FAB button */}
        <button
          onClick={toggleMenu}
          className={`rounded-full w-14 h-14 flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
            isOpen ? 'bg-red-500 rotate-45' : 'bg-primary'
          }`}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 transition-transform duration-300" 
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
    </div>
  );
};

export default FloatingActionButton;
