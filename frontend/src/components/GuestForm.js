import React, { useState } from 'react';
import axios from 'axios';
import db from '../utils/db';
import haptic from '../utils/haptic';

function GuestForm({ token, onGuestAdded, apiBaseUrl = '/api', isOnline = true }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Name is required');
      haptic.errorFeedback();
      return;
    }
    
    setLoading(true);
    
    const guestData = {
      name: name.trim(),
      contact: contact.trim()
    };
    
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
          invited: false,
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
      setName('');
      setContact('');
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
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Add New Guest</h2>
      
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name*
            </label>
            <input 
              id="name"
              type="text"
              placeholder="Guest name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="input w-full"
            />
          </div>
          
          <div className="col-span-1">
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact (Optional)
            </label>
            <input 
              id="contact"
              type="text"
              placeholder="Phone or email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={loading}
              className="input w-full"
            />
          </div>
          
          <div className="col-span-1 flex items-end">
            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary w-full relative overflow-hidden"
              onClick={() => haptic.lightFeedback()}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isOnline ? 'Adding...' : 'Saving Offline...'}
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Guest
                </span>
              )}
              
              {/* Progress animation */}
              {loading && (
                <div className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 animate-progress"></div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GuestForm;
