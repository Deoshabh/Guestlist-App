import React, { useState, useEffect } from 'react';
import axios from 'axios';
import db from '../utils/db';
import haptic from '../utils/haptic';
import ContactService from '../utils/ContactService';

function GuestForm({ 
  token, 
  onGuestAdded, 
  apiBaseUrl = '/api', 
  isOnline = true,
  selectedGroup = null, 
  guestGroups = [],
  onAddMultiple = null // New prop to enable multi-guest addition
}) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '', // New field
    phone: '', // New field
    invited: false,
    groupId: selectedGroup ? selectedGroup._id : '',
    firstName: '', // Add firstName field
    lastName: '',  // Add lastName field
    notes: ''      // Add notes field
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false); // Toggle for advanced fields

  useEffect(() => {
    if (selectedGroup) {
      setFormData(prev => ({
        ...prev,
        groupId: selectedGroup._id
      }));
    }
  }, [selectedGroup]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'firstName' || name === 'lastName') {
      // When firstName or lastName changes, update name field as well
      const newFirstName = name === 'firstName' ? value : formData.firstName;
      const newLastName = name === 'lastName' ? value : formData.lastName;
      const fullName = `${newFirstName} ${newLastName}`.trim();
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        name: fullName
      }));
    } else {
      // If setting phone or email, we also update 'contact' if it's empty
      if (name === 'phone' && (!formData.contact || formData.contact === formData.email)) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          contact: value // Update contact to match the phone
        }));
      } else if (name === 'email' && !formData.contact && !formData.phone) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          contact: value // Use email as contact if no phone
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Name is required');
      haptic.errorFeedback();
      return;
    }
    
    setLoading(true);
    
    const guestData = {
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      email: formData.email?.trim(), // Include new fields
      phone: formData.phone?.trim(), // Include new fields
      invited: formData.invited,
      groupId: formData.groupId || (selectedGroup ? selectedGroup._id : ''),
      notes: formData.notes?.trim() // Add notes field
    };
    
    // If onAddMultiple is provided, we're in multi-guest mode
    if (onAddMultiple) {
      onAddMultiple(guestData);
      haptic.lightFeedback();
      
      // Reset form for next entry
      setFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        invited: false,
        groupId: selectedGroup ? selectedGroup._id : '',
        firstName: '',
        lastName: '',
        notes: ''
      });
      
      setLoading(false);
      return;
    }
    
    try {
      if (isOnline) {
        // Online mode - send directly to server
        const response = await axios.post(`${apiBaseUrl}/guests`, guestData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Also save to IndexedDB for offline access
        try {
          await db.saveGuest(response.data);
        } catch (dbErr) {
          console.warn('Failed to save to local DB:', dbErr);
        }
        
        haptic.successFeedback();
      } else {
        // Offline mode - save to IndexedDB and queue for later
        // Generate a temporary ID that will be replaced when synced
        const tempGuest = {
          ...guestData,
          _id: `temp_${Date.now()}`,
          _pendingSync: true,
          invited: formData.invited || false,
          deleted: false,
          createdAt: new Date().toISOString()
        };
        
        // Save to local DB
        await db.saveGuest(tempGuest);
        
        // Queue the create action for later
        await db.queueAction('ADD_GUEST', guestData);
        
        haptic.successFeedback();
      }
      
      // Reset form and update UI
      setFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        invited: false,
        groupId: selectedGroup ? selectedGroup._id : '',
        firstName: '',
        lastName: '',
        notes: ''
      });
      onGuestAdded();
    } catch (err) {
      console.error(err);
      haptic.errorFeedback();
      setError(isOnline 
        ? (err.response?.data?.error || 'Error adding guest') 
        : 'Failed to save guest offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Add Guest</h2>
      
      {!isOnline && (
        <div className="p-3 mb-4 text-sm text-orange-700 bg-orange-100 rounded-lg dark:bg-orange-900 dark:text-orange-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Offline Mode - Guest will be synced when you reconnect</span>
        </div>
      )}
      
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First and Last Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name*
            </label>
            <input 
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input 
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name*
          </label>
          <input 
            id="fullName"
            name="name"
            type="text"
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            className="input w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will be automatically filled from first and last name fields.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input 
              id="phone"
              name="phone"
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="input w-full"
            />
          </div>
          
          <div className="col-span-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input 
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="input w-full"
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary dark:text-blue-400 hover:underline focus:outline-none"
        >
          {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
        </button>
        
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Group selection control */}
            <div>
              <label htmlFor="guestGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Guest Group
                </span>
              </label>
              <div className="relative">
                <select
                  id="guestGroup"
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  className="input w-full touch-manipulation appearance-none pl-10"
                  disabled={loading}
                >
                  <option value="">No group selected</option>
                  {guestGroups.map(group => (
                    <option key={group._id} value={group._id} className={group._pendingSync ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                      {group.name} {group._pendingSync ? '(pending sync)' : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 pointer-events-none">
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
                disabled={loading}
                className="input w-full"
                placeholder="Additional notes about this guest"
              />
            </div>

            {/* Contact field for backward compatibility */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact (Legacy)
              </label>
              <input 
                id="contact"
                name="contact"
                type="text"
                placeholder="Contact info (used by older versions)"
                value={formData.contact}
                onChange={handleChange}
                disabled={loading}
                className="input w-full"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Usually automatically filled from Phone or Email.
              </p>
            </div>
          </div>
        )}
        
        {/* Checkbox for invited status */}
        <div className="flex items-center">
          <input
            id="invited"
            name="invited"
            type="checkbox"
            checked={formData.invited}
            onChange={handleChange}
            className="h-5 w-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600 touch-manipulation"
          />
          <label htmlFor="invited" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Already Invited
          </label>
        </div>
        
        {/* Form buttons */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setFormData({
              name: '',
              contact: '',
              email: '',
              phone: '',
              invited: false,
              groupId: selectedGroup ? selectedGroup._id : '',
              firstName: '',
              lastName: '',
              notes: ''
            })}
            disabled={loading}
            className="btn btn-outline touch-manipulation"
          >
            Reset
          </button>
          
          {onAddMultiple && (
            <button
              type="button"
              onClick={() => {
                try {
                  // Make sure the temporary guest is created properly
                  const tempGuest = {
                    id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    name: '',
                    contact: '',
                    email: '',
                    phone: '',
                    invited: false,
                    groupId: formData.groupId || (selectedGroup ? selectedGroup._id : '')
                  };
                  
                  // Pass the tempGuest to the parent component
                  onAddMultiple(tempGuest);
                  haptic.lightFeedback();
                } catch (err) {
                  console.error("Error adding guest to pending list:", err);
                  setError("Failed to add guest to pending list");
                  haptic.errorFeedback();
                }
              }}
              disabled={loading}
              className="btn btn-secondary touch-manipulation"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another
              </span>
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="btn btn-primary touch-manipulation"
          >
            {loading ? 'Adding...' : onAddMultiple ? 'Add to List' : 'Add Guest'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GuestForm;
