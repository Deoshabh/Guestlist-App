import React, { useRef } from 'react';
import { useToast } from './ToastManager';
import haptic from '../utils/haptic';
import { openWhatsAppChat } from '../utils/whatsappUtils';
import { useGuestGroups } from '../contexts/GuestGroupsContext';

const SingleGuestRow = ({ 
  guest, 
  onSelect, 
  showGroupName = true, 
  showCheckbox = false, 
  isSelected = false, 
  onCheckboxChange = null,
  compact = false
}) => {
  const toast = useToast();
  const { groups } = useGuestGroups();
  const rowRef = useRef(null);
  const checkboxRef = useRef(null);
  
  // Find group this guest belongs to
  const group = guest.groupId 
    ? groups.find(g => g._id === guest.groupId) 
    : null;

  const handleQuickWhatsApp = (e) => {
    e.stopPropagation(); // Prevent row click
    
    if (!guest.phone) {
      toast.error('Guest has no phone number');
      haptic.errorFeedback();
      return;
    }
    
    const success = openWhatsAppChat(guest, 'Hello {{name}}!', { guestGroups: groups });
    
    if (success) {
      toast.success('Opening WhatsApp');
      haptic.successFeedback();
    } else {
      toast.error('Could not open WhatsApp');
      haptic.errorFeedback();
    }
  };

  // Handle row click with better touch support
  const handleRowClick = (e) => {
    // If clicking on a button or checkbox, don't handle row click
    if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) {
      return;
    }
    
    if (onSelect) {
      onSelect(guest);
      haptic.lightFeedback();
    }
  };

  // Handle checkbox change with improved touch handling
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onCheckboxChange) {
      onCheckboxChange(guest);
      haptic.lightFeedback();
    }
  };

  return (
    <div 
      ref={rowRef}
      className={`${compact ? 'py-2 px-3' : 'p-3'} bg-white dark:bg-gray-800 rounded-md 
        shadow-sm hover:shadow transition-shadow
        ${isSelected ? 'border-2 border-blue-500 dark:border-blue-600' : 'border border-gray-200 dark:border-gray-700'}
        relative touch-manipulation active:bg-gray-50 dark:active:bg-gray-750`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-grow">
          {showCheckbox && (
            <div 
              className="mr-3 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                // Programmatically click the checkbox for better touch area
                if (checkboxRef.current) {
                  checkboxRef.current.click();
                }
              }}
            >
              <input
                ref={checkboxRef}
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                aria-label={`Select ${guest.name}`}
              />
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{guest.name}</h3>
            {!compact && guest.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{guest.email}</p>
            )}
            {showGroupName && group && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {group.name}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {guest.phone ? (
            <button
              onClick={handleQuickWhatsApp}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-2 -m-2 touch-manipulation"
              title="Send WhatsApp message"
              aria-label={`Send WhatsApp message to ${guest.name}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          ) : (
            <span className="text-gray-300 dark:text-gray-600" title="No phone number">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636" />
              </svg>
            </span>
          )}
          
          {guest.invited ? (
            <span className="text-green-600 dark:text-green-400" title="Guest invited">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="text-yellow-500 dark:text-yellow-400" title="Not invited yet">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
              </svg>
            </span>
          )}
        </div>
      </div>
      
      {/* Touch indicator for accessibility */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className={`absolute inset-0 transition-opacity opacity-0 ${isSelected ? 'bg-blue-50 dark:bg-blue-900 opacity-20' : ''}`}></div>
      </div>
    </div>
  );
};

export default SingleGuestRow;
