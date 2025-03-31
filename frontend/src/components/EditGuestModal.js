import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import haptic from '../utils/haptic';
import db from '../utils/db';

const EditGuestModal = ({ guest, isOpen, onClose, onUpdate, token, apiBaseUrl = '/api', guestGroups = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',  // Add email field
    phone: '',  // Add phone field
    invited: false,
    groupId: '',
    firstName: '', // Add firstName field from guest version
    lastName: '',  // Add lastName field from guest version
    notes: ''      // Add notes field from guest version
  });
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
      // Extract first/last name from name field if available
      let firstName = '', lastName = '';
      if (guest.name && guest.name.includes(' ')) {
        const nameParts = guest.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        firstName = guest.name || '';
      }

      setFormData({
        name: guest.name || '',
        contact: guest.contact || '',
        email: guest.email || '',  // Initialize email
        phone: guest.phone || '',  // Initialize phone
        invited: guest.invited || false,
        groupId: guest.groupId || '',
        firstName,
        lastName,
        notes: guest.notes || ''
      });
      setNameError('');
    }
  }, [guest]);

  // Handle animation and focus management
  useEffect(() => {
    if (isOpen) {
      // Ensure the modal is visible first
      setFormVisible(true);
      
      // Scroll the modal into view
      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        
        // Focus the name input after animation completes
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
    setFormData({ ...formData, name: value });
    validateName(value);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'firstName' || name === 'lastName') {
      // When firstName or lastName changes, update name field as well
      const newFirstName = name === 'firstName' ? value : formData.firstName;
      const newLastName = name === 'lastName' ? value : formData.lastName;
      const fullName = `${newFirstName} ${newLastName}`.trim();
      
      setFormData({
        ...formData, 
        [name]: value,
        name: fullName
      });
    } else if (name === 'phone' && (!formData.contact || formData.contact === formData.email)) {
      setFormData({
        ...formData, 
        [name]: value,
        contact: value // Update contact if it was empty or matched email
      });
    } else if (name === 'email' && !formData.contact && !formData.phone) {
      setFormData({
        ...formData, 
        [name]: value,
        contact: value // Use email as contact if no phone or contact
      });
    } else {
      setFormData({
        ...formData, 
        [name]: type === 'checkbox' ? checked : value
      });
    }
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
    
    if (!validateName(formData.name)) {
      haptic.errorFeedback();
      return;
    }
    
    setLoading(true);
    
    // Prepare update data
    const updateData = {
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      email: formData.email?.trim(),  // Include email in update
      phone: formData.phone?.trim(),  // Include phone in update
      invited: formData.invited,
      groupId: formData.groupId || null,
      notes: formData.notes || ''  // Include notes field
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
      className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`} 
          aria-hidden="true"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div 
          ref={modalRef}
          className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
            formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
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
              {/* First and Last Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name*
                  </label>
                  <input 
                    id="edit-firstName"
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="input w-full h-12 text-base"
                    ref={nameInputRef}
                  />
                </div>
                <div>
                  <label htmlFor="edit-lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input 
                    id="edit-lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    className="input w-full h-12 text-base"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name*
                </label>
                <input 
                  id="edit-name"
                  ref={nameInputRef}
                  type="text"
                  placeholder="Guest name"
                  value={formData.name}
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
                  value={formData.contact}
                  onChange={handleChange}
                  name="contact"
                  disabled={loading}
                  className="input w-full h-12 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input w-full"
                  disabled={loading}
                  placeholder="Phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input w-full"
                  disabled={loading}
                  placeholder="Email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="contact">
                  Legacy Contact
                </label>
                <input
                  id="contact"
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="input w-full"
                  disabled={loading}
                  placeholder="Contact info (used by older versions)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Usually automatically filled from Phone or Email.
                </p>
              </div>

              <div>
                <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Guest Group
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="groupId"
                    name="groupId"
                    value={formData.groupId || ''}
                    onChange={handleChange}
                    className="input w-full touch-manipulation appearance-none pl-10 h-12 text-base"
                    disabled={loading}
                  >
                    <option value="">No group selected</option>
                    {guestGroups.map(group => (
                      <option key={group._id} value={group._id} className={group._pendingSync ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                        {group.name} {group._pendingSync ? '(pending sync)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {guestGroups.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    No groups available. Create a group first.
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="input w-full"
                  disabled={loading}
                  placeholder="Additional notes about this guest"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="invited"
                  type="checkbox"
                  name="invited"
                  checked={formData.invited}
                  onChange={handleChange}
                  className="h-5 w-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                  disabled={loading}
                />
                <label htmlFor="invited" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Already Invited
                </label>
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
    </div>
  );
};

export default EditGuestModal;
