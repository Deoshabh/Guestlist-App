import React from 'react';
import haptic from '../utils/haptic';

const GuestListItem = ({
  guest,
  isSelected,
  onToggleSelect,
  onEdit,
  onToggleInvited,
  onDelete,
  onRestore,
  guestGroups = []
}) => {
  // Get the group name if available
  const groupName = guest.groupId 
    ? guestGroups.find(g => g._id === guest.groupId)?.name || 'Unknown Group' 
    : 'No Group';

  const handleAction = (action, e) => {
    e.stopPropagation(); // Prevent click from bubbling to the card
    haptic.lightFeedback();
    action();
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3 transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onToggleSelect()}
    >
      <div className="flex justify-between mb-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect()}
            className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="ml-2 font-medium dark:text-white">{guest.name}</span>
          {guest._pendingSync && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full">
              Pending Sync
            </span>
          )}
        </label>
        <span className={`px-2 py-1 text-xs rounded ${guest.invited ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {guest.invited ? 'Invited' : 'Not Invited'}
        </span>
      </div>
      
      <div className="space-y-1 mb-3">
        {guest.contact && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">Contact:</span> {guest.contact}
          </p>
        )}
        {guest.email && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">Email:</span> {guest.email}
          </p>
        )}
        {guest.phone && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">Phone:</span> {guest.phone}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Group:</span> {groupName}
        </p>
      </div>
      
      <div className="flex flex-wrap justify-end gap-2 mt-3">
        <button
          onClick={(e) => handleAction(onEdit, e)}
          className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
          aria-label={`Edit ${guest.name}`}
        >
          Edit
        </button>
        <button
          onClick={(e) => handleAction(onToggleInvited, e)}
          className={`px-3 py-2 text-sm rounded ${guest.invited ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
          aria-label={guest.invited ? `Uninvite ${guest.name}` : `Invite ${guest.name}`}
        >
          {guest.invited ? 'Uninvite' : 'Invite'}
        </button>
        {guest.deleted ? (
          <button
            onClick={(e) => handleAction(onRestore, e)}
            className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
            aria-label={`Restore ${guest.name}`}
          >
            Restore
          </button>
        ) : (
          <button
            onClick={(e) => handleAction(onDelete, e)}
            className="px-3 py-2 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
            aria-label={`Delete ${guest.name}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default GuestListItem;
