import React from 'react';
import { useToast } from './ToastManager';
import haptic from '../utils/haptic';
import GroupMembershipManager from './GroupMembershipManager';

const GuestListItem = ({ 
  guest, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onToggleInvited, 
  onDelete,
  onRestore,
  token,
  guestGroups = [],
  apiBaseUrl = '/api',
  isOnline = true,
  onUpdate
}) => {
  const toast = useToast();
  
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-all duration-200 card-hover mb-3 ${
        guest.deleted ? 'opacity-50' : ''
      } ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onToggleSelect()} // Make the entire card selectable for easier mobile interaction
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation(); // Prevent card click from triggering
              onToggleSelect();
            }}
            className="w-5 h-5 mt-1 text-primary bg-gray-100 border-gray-300 rounded touch-manipulation"
            aria-label={`Select ${guest.name}`}
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {guest.name}
              {guest._pendingSync && (
                <span className="ml-2 inline-block w-2 h-2 bg-yellow-400 rounded-full" title="Pending sync"></span>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{guest.contact || 'No contact info'}</p>
            
            {/* Show group information */}
            {guest.groupId && typeof guest.groupId === 'object' && guest.groupId.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {guest.groupId.name}
              </p>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          guest.invited 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>
          {guest.invited ? 'Invited' : 'Not Invited'}
        </span>
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2 mt-4 justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card selection
            haptic.mediumFeedback();
            onEdit();
          }}
          className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 flex items-center shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card selection
            haptic.mediumFeedback();
            onToggleInvited();
          }}
          className={`px-3 py-2 text-sm rounded flex items-center shadow-sm ${
            guest.invited
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {guest.invited ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            )}
          </svg>
          {guest.invited ? 'Mark Not Invited' : 'Mark Invited'}
        </button>
        
        {!guest.deleted ? (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card selection
              haptic.strongFeedback();
              onDelete();
            }}
            className="px-3 py-2 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 flex items-center shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card selection
              haptic.mediumFeedback();
              onRestore();
            }}
            className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 flex items-center shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Restore
          </button>
        )}
      </div>
    </div>
  );
};

export default GuestListItem;
