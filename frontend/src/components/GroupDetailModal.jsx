import React, { useState, useEffect } from 'react';
import { useGuestGroups } from '../contexts/GuestGroupsContext';
import { useGuests } from '../contexts/GuestsContext';
import { useToast } from './ToastManager';
import Modal from './Modal';
import GuestList from './GuestList';
import haptic from '../utils/haptic';

const GroupDetailModal = ({ group, onClose, onDelete, onEdit, onSendMessages }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState(group.name || '');
  const [description, setDescription] = useState(group.description || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [groupGuests, setGroupGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { updateGroup } = useGuestGroups();
  const { guests, fetchGuests } = useGuests();
  const toast = useToast();

  useEffect(() => {
    const loadGuests = async () => {
      setIsLoading(true);
      if (!guests.length) {
        await fetchGuests();
      }
      
      // Filter guests that belong to this group
      const filtered = guests.filter(guest => guest.groupId === group._id);
      setGroupGuests(filtered);
      setIsLoading(false);
    };
    
    loadGuests();
  }, [group._id, guests, fetchGuests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Group name is required');
      haptic.errorFeedback();
      return;
    }
    
    try {
      const updatedGroup = await updateGroup({
        ...group,
        name,
        description
      });
      
      toast.success('Group updated successfully');
      haptic.successFeedback();
      setIsEditMode(false);
      
      if (onEdit) {
        onEdit(updatedGroup);
      }
    } catch (error) {
      toast.error('Failed to update group');
      haptic.errorFeedback();
      console.error('Error updating group:', error);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      if (onDelete) {
        onDelete();
      }
    } else {
      setConfirmDelete(true);
      haptic.warningFeedback();
    }
  };

  const handleSendMessages = () => {
    if (onSendMessages && groupGuests.length > 0) {
      onSendMessages(groupGuests);
    } else if (groupGuests.length === 0) {
      toast.warning('This group has no guests');
      haptic.warningFeedback();
    }
  };

  return (
    <Modal onClose={onClose} title={isEditMode ? "Edit Group" : group.name}>
      {isEditMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="name"
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="input w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group description (optional)"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsEditMode(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="mb-4">
            {group.description && (
              <p className="text-gray-600 dark:text-gray-400">{group.description}</p>
            )}
          </div>
          
          <div className="flex mb-6 space-x-2 justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditMode(true)}
                className="btn btn-outline btn-sm"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </div>
              </button>
              
              <button
                onClick={handleDelete}
                className={`btn ${confirmDelete ? 'btn-danger' : 'btn-outline'} btn-sm`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </div>
              </button>
            </div>
            
            <button
              onClick={handleSendMessages}
              className="btn btn-success btn-sm"
              disabled={groupGuests.length === 0}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Send Messages
              </div>
            </button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Guests in this Group</h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="spinner"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading guests...</p>
              </div>
            ) : groupGuests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No guests in this group yet</p>
                <button 
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={onClose}
                >
                  Add guests from the Guests page
                </button>
              </div>
            ) : (
              <GuestList 
                guests={groupGuests} 
                compact={true} 
                showGroupName={false} 
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default GroupDetailModal;
