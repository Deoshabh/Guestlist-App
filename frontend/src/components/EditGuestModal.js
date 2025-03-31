import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import haptic from '../utils/haptic';
import db from '../utils/db';

const EditGuestModal = ({ guest, isOpen, onClose, onUpdate, token, apiBaseUrl = '/api' }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  // Initialize the form values when the guest prop changes
  useEffect(() => {
    if (guest) {
      setName(guest.name || '');
      setContact(guest.contact || '');
      setNameError('');
    }
  }, [guest]);

  // Handle animation and focus management
  useEffect(() => {
    if (isOpen) {
      setFormVisible(true);
      // Focus the name input after animation completes
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setFormVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle clicking outside to close
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle escape key to close modal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen]);

  // Real-time name validation
  const validateName = (value) => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    } else if (value.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    } else {
      setNameError('');
      return true;
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  const handleClose = () => {
    if (!loading) {
      // Provide haptic feedback
      haptic.lightFeedback();
      // Start exit animation
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateName(name)) {
      haptic.errorFeedback();
      return;
    }
    
    setLoading(true);
    
    // Prepare update data
    const updateData = {
      name: name.trim(),
      contact: contact.trim()
    };
    
    // Check if online
    if (navigator.onLine) {
      try {
        const response = await axios.put(
          `${apiBaseUrl}/guests/${guest._id}`, 
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Also update local storage for offline access
        try {
          await db.saveGuest(response.data);
        } catch (dbError) {
          console.warn('Failed to save to local DB:', dbError);
        }
        
        // Provide success feedback
        haptic.successFeedback();
        
        // Optimistic UI update before closing modal
        onUpdate(response.data);
        handleClose();
      } catch (err) {
        console.error('Error updating guest:', err);
        setError(err.response?.data?.error || 'Failed to update guest');
        haptic.errorFeedback();
      } finally {
        setLoading(false);
      }
    } else {
      // Offline mode: Save to IndexedDB and queue for later sync
      try {
        // Create a temporary guest with the updated values
        const updatedGuest = { ...guest, ...updateData, _pendingSync: true };
        
        // Save to local DB
        await db.saveGuest(updatedGuest);
        
        // Queue the update for later
        await db.queueAction('UPDATE_GUEST', {
          id: guest._id,
          data: updateData
        });
        
        haptic.successFeedback();
        onUpdate(updatedGuest);
        handleClose();
      } catch (offlineErr) {
        console.error('Offline update error:', offlineErr);
        setError('Could not save offline. Please try again.');
        haptic.errorFeedback();
      } finally {
        setLoading(false);
      }
    }
  };

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    if (!isOpen) return;
    
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    
    // Calculate delta
    const deltaY = touchY - touchStartY.current;
    const deltaX = touchX - touchStartX.current;
    
    // Only handle swipes that are more vertical than horizontal
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 20) {
      setIsSwiping(true);
      setSwipeOffset(deltaY);
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = (e) => {
    if (isSwiping) {
      // If swiped down more than 100px, close the modal
      if (swipeOffset > 100) {
        handleClose();
      }
      
      // Reset swipe state
      setIsSwiping(false);
      setSwipeOffset(0);
    }
  };

  if (!isOpen && !formVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black transition-opacity duration-300 flex items-center justify-center z-50 p-4 ${
        isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${isSwiping ? 'transition-none' : ''}`}
        style={isSwiping ? { transform: `translateY(${swipeOffset}px)` } : {}}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe handle indicator for mobile */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-1"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">Edit Guest</h2>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Network status indicator */}
          <div className={`text-xs mb-3 flex items-center ${navigator.onLine ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-1 ${navigator.onLine ? 'bg-green-600 dark:bg-green-400' : 'bg-orange-600 dark:bg-orange-400'}`}></div>
            {navigator.onLine ? 'Online' : 'Offline Mode'}
          </div>
          
          {error && (
            <div 
              className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200 animate-fadeIn"
              role="alert"
            >
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name*
              </label>
              <input 
                id="edit-name"
                ref={nameInputRef}
                type="text"
                placeholder="Guest name"
                value={name}
                onChange={handleNameChange}
                required
                disabled={loading}
                className={`input w-full h-12 text-base ${
                  nameError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                }`}
                aria-invalid={nameError ? 'true' : 'false'}
                aria-describedby={nameError ? 'name-error' : undefined}
              />
              {nameError && (
                <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400 animate-fadeIn">
                  {nameError}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="edit-contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact (Optional)
              </label>
              <input 
                id="edit-contact"
                type="text"
                placeholder="Phone or email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={loading}
                className="input w-full h-12 text-base"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                type="button" 
                onClick={handleClose}
                disabled={loading}
                className="btn btn-outline h-12 min-w-[100px] text-base"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || nameError} 
                className="btn btn-primary h-12 min-w-[140px] text-base relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {navigator.onLine ? 'Saving...' : 'Saving Offline...'}
                  </span>
                ) : 'Save Changes'}
                
                {/* Progress animation for touch feedback */}
                {loading && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 animate-progress"></div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditGuestModal;
