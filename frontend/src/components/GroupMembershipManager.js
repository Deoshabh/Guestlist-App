import React, { useState } from 'react';
import axios from 'axios';
import haptic from '../utils/haptic';
import { useToast } from './ToastManager';
import db from '../utils/db';

const GroupMembershipManager = ({ 
  token, 
  guest, 
  guestGroups = [], 
  onUpdate, 
  apiBaseUrl = '/api',
  isOnline = true
}) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  // Get current group name
  const getCurrentGroupName = () => {
    if (!guest.groupId) return "No Group";
    
    // Handle both populated objects and just IDs
    if (typeof guest.groupId === 'object' && guest.groupId?.name) {
      return guest.groupId.name;
    }
    
    // Look up in guestGroups
    const group = guestGroups.find(g => g._id === guest.groupId);
    return group ? group.name : "Unknown Group";
  };

  // Handle moving guest to a group
  const moveToGroup = async (groupId) => {
    if (loading) return;
    
    // Don't do anything if the group is the same
    if (groupId === (typeof guest.groupId === 'object' ? guest.groupId?._id : guest.groupId)) {
      setIsOpen(false);
      return;
    }
    
    setLoading(true);
    
    try {
      if (isOnline) {
        // Online mode - send directly to server
        await axios.put(
          `${apiBaseUrl}/guests/${guest._id}`, 
          { groupId }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        haptic.successFeedback();
        toast.success(`Moved to ${groupId ? guestGroups.find(g => g._id === groupId)?.name || 'new group' : 'no group'}`);
      } else {
        // Offline mode - update locally and queue for later
        const updatedGuest = { 
          ...guest, 
          groupId, 
          _pendingSync: true 
        };
        
        // Save to local DB
        await db.saveGuest(updatedGuest);
        
        // Queue the update for later sync
        await db.queueAction('UPDATE_GUEST', {
          id: guest._id,
          data: { groupId }
        });
        
        haptic.successFeedback();
        toast.success(`Moved to ${groupId ? guestGroups.find(g => g._id === groupId)?.name || 'new group' : 'no group'} (offline)`);
      }
      
      onUpdate();
    } catch (err) {
      console.error('Error moving guest to group:', err);
      haptic.errorFeedback();
      toast.error(isOnline 
        ? 'Failed to update group'
        : 'Failed to update group offline');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="truncate max-w-[100px]">{getCurrentGroupName()}</span>
        <svg className="-mr-1 ml-1 h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7l5 5 5-5" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 divide-y divide-gray-100 dark:divide-gray-700"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1 px-2 text-sm text-gray-700 dark:text-gray-200 font-medium bg-gray-50 dark:bg-gray-700 rounded-t-md">
            Move to Group
          </div>
          
          <div className="py-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => moveToGroup(null)}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              role="menuitem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              No Group
            </button>
            
            {guestGroups.map(group => (
              <button
                key={group._id}
                onClick={() => moveToGroup(group._id)}
                className={`flex items-center w-full px-4 py-2.5 text-sm text-left
                  ${group._id === (typeof guest.groupId === 'object' ? guest.groupId?._id : guest.groupId)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                role="menuitem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate max-w-[150px]">{group.name}</span>
                {group._pendingSync && (
                  <span className="ml-1 w-2 h-2 bg-yellow-400 rounded-full" title="Pending sync"></span>
                )}
              </button>
            ))}
          </div>
          
          {guestGroups.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 italic">
              No groups available. Create a group first.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupMembershipManager;
