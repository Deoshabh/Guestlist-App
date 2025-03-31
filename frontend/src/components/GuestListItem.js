import React from 'react';
import SwipeAction from './SwipeAction';
import { useToast } from './ToastManager';

const GuestListItem = ({ guest, onEdit, onToggleInvited, onDelete, onRestore, selected, onSelect }) => {
  const toast = useToast();
  
  // Define swipe actions
  const leftActions = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      label: "Edit",
      bgColor: "bg-blue-500",
      onPress: () => {
        onEdit();
        toast.info("Editing guest");
      }
    }
  ];
  
  const rightActions = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {guest.invited ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          )}
        </svg>
      ),
      label: guest.invited ? "Uninvite" : "Invite",
      bgColor: guest.invited ? "bg-yellow-500" : "bg-green-500",
      onPress: () => {
        onToggleInvited();
        toast.success(`Guest ${guest.invited ? 'uninvited' : 'invited'}`);
      }
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {guest.deleted ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          )}
        </svg>
      ),
      label: guest.deleted ? "Restore" : "Delete",
      bgColor: guest.deleted ? "bg-blue-500" : "bg-red-500",
      onPress: () => {
        if (guest.deleted) {
          onRestore();
          toast.success("Guest restored");
        } else {
          // Confirm delete
          if (window.confirm("Are you sure you want to delete this guest?")) {
            onDelete();
            toast.warning("Guest deleted");
          }
        }
      }
    }
  ];
  
  return (
    <SwipeAction leftActions={leftActions} rightActions={rightActions}>
      <div 
        className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 ${
          guest.deleted ? 'opacity-50' : ''
        } ${
          selected ? 'ring-2 ring-primary' : ''
        }`}
      >
        <div className="flex justify-between mb-2">
          <div className="flex items-start space-x-3">
            <input 
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="w-5 h-5 mt-1 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
            />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {guest.name}
                {guest._pendingSync && (
                  <span className="ml-2 inline-block w-2 h-2 bg-yellow-400 rounded-full" title="Pending sync"></span>
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{guest.contact || 'No contact info'}</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className={`px-2 py-1 text-xs rounded ${
              guest.invited 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {guest.invited ? 'Invited' : 'Not Invited'}
            </span>
          </div>
        </div>
      </div>
    </SwipeAction>
  );
};

export default GuestListItem;
