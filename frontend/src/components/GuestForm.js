import React, { useState } from 'react';
import axios from 'axios';

function GuestForm({ token, onGuestAdded, apiBaseUrl = '/api' }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${apiBaseUrl}/guests`, { 
        name: name.trim(), 
        contact: contact.trim() 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setName('');
      setContact('');
      onGuestAdded();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error adding guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Add New Guest</h2>
      
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
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Guest
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GuestForm;
