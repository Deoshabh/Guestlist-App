import React, { useState } from 'react';
import { useToast } from './ToastManager';
import Modal from './Modal';
import { useGuestGroups } from '../contexts/GuestGroupsContext';
import haptic from '../utils/haptic';
import { openWhatsAppChat } from '../utils/whatsappUtils';

const GuestDetailModal = ({ guest, onClose, onEdit, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { groups } = useGuestGroups();
  const toast = useToast();
  
  // Find the group this guest belongs to
  const groupName = guest.groupId 
    ? groups.find(g => g._id === guest.groupId)?.name || 'Unknown Group' 
    : 'No Group Assigned';

  const handleEdit = () => {
    if (onEdit) {
      onEdit(guest);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      if (onDelete) {
        onDelete(guest._id);
      }
    } else {
      setConfirmDelete(true);
      haptic.warningFeedback();
    }
  };

  const handleSendWhatsApp = () => {
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
    <Modal onClose={onClose} title="Guest Details">
      <div className="space-y-4">
        {/* Guest info card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{guest.name}</h2>
          
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            {guest.email && (
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{guest.email}</span>
              </p>
            )}
            
            {guest.phone && (
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{guest.phone}</span>
              </p>
            )}
            
            {guest.address && (
              <p className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{guest.address}</span>
              </p>
            )}
            
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{groupName}</span>
            </p>
          </div>
        </div>
        
        {/* Notes section */}
        {guest.notes && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{guest.notes}</p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between">
          <div className="space-x-2">
            <button 
              onClick={handleEdit}
              className="btn btn-outline"
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
              className={`btn ${confirmDelete ? 'btn-danger' : 'btn-outline'}`}
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
            onClick={handleSendWhatsApp}
            disabled={!guest.phone}
            className="btn btn-success"
            title={guest.phone ? 'Send WhatsApp message' : 'No phone number available'}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              WhatsApp
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GuestDetailModal;
