import React, { useState } from 'react';
import haptic from '../utils/haptic';

const FloatingActionButton = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Ensure actions is always an array
  const safeActions = Array.isArray(actions) ? actions : [];
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    haptic.lightFeedback();
  };
  
  return (
    <div className="fixed right-4 bottom-20 z-50">
      {/* Action buttons */}
      {isOpen && safeActions.length > 0 && (
        <div className="flex flex-col-reverse mb-2 gap-2 animate-fadeIn">
          {safeActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                if (typeof action?.onClick === 'function') {
                  action.onClick();
                }
                setIsOpen(false);
              }}
              className="bg-white dark:bg-gray-700 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-primary dark:text-primary-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              aria-label={action?.label || `Action ${index}`}
            >
              {action?.icon || null}
              
              {/* Action label tooltip */}
              <span className="absolute right-14 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {action?.label || ''}
              </span>
            </button>
          ))}
        </div>
      )}
      
      {/* Main FAB button */}
      <button
        onClick={toggleOpen}
        className="bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors focus:outline-none"
        aria-label={isOpen ? "Close actions" : "Open actions"}
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
