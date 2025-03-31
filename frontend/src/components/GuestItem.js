import React, { useState } from 'react';
import { useGuests } from '../contexts/GuestContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useToast } from './ToastManager';
import haptic from '../utils/haptic';

const GuestItem = ({ guest, viewMode = 'list' }) => {
  const { updateGuest, deleteGuest } = useGuests();
  const { isOnline } = useNetwork();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not checked in';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Toggle expanded state with haptic feedback
  const toggleExpand = () => {
    try {
      haptic.selectionFeedback();
    } catch (e) {
      // Ignore haptic errors
    }
    setExpanded(!expanded);
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (!isOnline) {
      toast.warning('You are offline. Changes will be synced when you reconnect.');
    }
    
    try {
      setIsLoading(true);
      haptic.selectionFeedback();
      
      const updatedGuest = {
        ...guest,
        status: newStatus,
        // If status is checked in, set checkin time to now
        checkinTime: newStatus === 'checked-in' ? new Date().toISOString() : guest.checkinTime
      };
      
      await updateGuest(updatedGuest);
      toast.success(`Guest ${newStatus === 'checked-in' ? 'checked in' : 'status updated'}`);
    } catch (error) {
      console.error('Error updating guest status:', error);
      toast.error('Failed to update guest status');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle guest deletion
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${guest.name}?`)) {
      return;
    }
    
    if (!isOnline) {
      toast.warning('You are offline. Changes will be synced when you reconnect.');
    }
    
    try {
      setIsLoading(true);
      haptic.warningFeedback();
      await deleteGuest(guest.id);
      toast.success('Guest deleted');
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to delete guest');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'checked-in':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'no-show':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: // pending
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
    }
  };

  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <div className={`card ${expanded ? 'ring-2 ring-primary' : 'card-hover'} transition-all duration-200`}>
        <div 
          className="cursor-pointer" 
          onClick={toggleExpand}
          aria-expanded={expanded}
        >
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{guest.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(guest.status)}`}>
              {guest.status?.replace('-', ' ')}
            </span>
          </div>
          
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <p>{guest.phone}</p>
            {guest.email && <p className="truncate">{guest.email}</p>}
            {guest.notes && (
              <p className="mt-1 italic">{expanded ? guest.notes : `${guest.notes.slice(0, 60)}${guest.notes.length > 60 ? '...' : ''}`}</p>
            )}
          </div>
          
          {guest.checkinTime && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Checked in: {formatDate(guest.checkinTime)}
            </div>
          )}
        </div>
        
        {expanded && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              className="btn btn-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
              onClick={() => handleStatusChange('checked-in')}
              disabled={isLoading || guest.status === 'checked-in'}
            >
              Check In
            </button>
            <button
              className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
              onClick={() => handleStatusChange('pending')}
              disabled={isLoading || guest.status === 'pending'}
            >
              Pending
            </button>
            <button
              className="btn btn-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              onClick={() => handleStatusChange('no-show')}
              disabled={isLoading || guest.status === 'no-show'}
            >
              No Show
            </button>
            <button
              className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50"
              onClick={() => handleStatusChange('cancelled')}
              disabled={isLoading || guest.status === 'cancelled'}
            >
              Cancel
            </button>
            <button
              className="btn btn-sm bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 col-span-2"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  // List view layout (default)
  return (
    <div className={`card ${expanded ? 'ring-2 ring-primary' : 'card-hover'}`}>
      <div 
        className="cursor-pointer" 
        onClick={toggleExpand}
        aria-expanded={expanded}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{guest.name}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>{guest.phone}</p>
              {guest.email && <p className="truncate">{guest.email}</p>}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(guest.status)}`}>
              {guest.status?.replace('-', ' ')}
            </span>
            {guest.checkinTime && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(guest.checkinTime)}
              </span>
            )}
          </div>
        </div>
        
        {guest.notes && (
          <div className="mt-2 text-sm italic text-gray-600 dark:text-gray-400">
            {expanded ? guest.notes : `${guest.notes.slice(0, 60)}${guest.notes.length > 60 ? '...' : ''}`}
          </div>
        )}
      </div>
      
      {expanded && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="btn btn-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            onClick={() => handleStatusChange('checked-in')}
            disabled={isLoading || guest.status === 'checked-in'}
          >
            Check In
          </button>
          <button
            className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
            onClick={() => handleStatusChange('pending')}
            disabled={isLoading || guest.status === 'pending'}
          >
            Pending
          </button>
          <button
            className="btn btn-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            onClick={() => handleStatusChange('no-show')}
            disabled={isLoading || guest.status === 'no-show'}
          >
            No Show
          </button>
          <button
            className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50"
            onClick={() => handleStatusChange('cancelled')}
            disabled={isLoading || guest.status === 'cancelled'}
          >
            Cancel
          </button>
          <button
            className="btn btn-sm bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 ml-auto"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestItem;
