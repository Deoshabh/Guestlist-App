import React from 'react';
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

  return (
    <div 
      className={`${compact ? 'py-2 px-3' : 'p-3'} bg-white dark:bg-gray-800 rounded-md cursor-pointer 
        shadow-sm hover:shadow transition-shadow
        ${isSelected ? 'border-2 border-blue-500 dark:border-blue-600' : 'border border-gray-200 dark:border-gray-700'}`}
      onClick={() => onSelect && onSelect(guest)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-grow">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onCheckboxChange && onCheckboxChange(guest);
              }}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
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
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              title="Send WhatsApp message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          ) : (
            <span className="text-xs text-red-500 dark:text-red-400">No phone</span>
          )}
          
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SingleGuestRow;
