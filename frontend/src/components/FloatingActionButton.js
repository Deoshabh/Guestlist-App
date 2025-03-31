import React, { useState } from 'react';
import haptic from '../utils/haptic';

const FloatingActionButton = ({ actions, position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    haptic.mediumFeedback();
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action) => {
    haptic.lightFeedback();
    action.onClick();
    setIsOpen(false);
  };

  // Determine position classes
  const positionClasses = {
    'bottom-right': 'bottom-24 right-4',
    'bottom-left': 'bottom-24 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position] || positionClasses['bottom-right']} z-40`}>
      {/* Sub actions */}
      {isOpen && (
        <div className="flex flex-col-reverse gap-2 mb-3 animate-fadeIn">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className="flex items-center w-auto h-10 pl-2 pr-3 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-lg transform transition-transform hover:scale-105 active:scale-95"
              aria-label={action.label}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-2">
                {action.icon}
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Main button */}
      <button
        onClick={toggleOpen}
        className={`flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg transition-transform ${isOpen ? 'rotate-45' : ''} hover:bg-primary-dark active:scale-95`}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionButton;
