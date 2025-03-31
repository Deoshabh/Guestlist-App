/**
 * Centralized API error handling utility
 * Provides consistent error handling for API requests and improves offline support
 */

import { queueAction } from './db';

/**
 * Handles API request errors with intelligent fallback and offline queueing
 * 
 * @param {Error} error - The error object from the API call
 * @param {string} actionType - The type of action being performed (e.g., 'fetchGuests')
 * @param {Object} data - The data related to the action (for offline queueing)
 * @param {Function} fallbackFn - Optional function to call for local data fallback
 */
export const handleApiError = async (error, actionType, data = {}, fallbackFn = null) => {
  // Log detailed error information
  console.error(`API Error in ${actionType}:`, error);

  // Check if error is from a response with an error status
  if (error.response) {
    console.error(`Status: ${error.response.status}`, error.response.data);
  }

  // Check if error is due to network connectivity (offline)
  if (!navigator.onLine || error.message === 'Network Error') {
    console.log(`Device appears to be offline. Queueing ${actionType} for later sync`);
    
    try {
      // Only queue applicable actions that modify data
      if (['addGuest', 'updateGuest', 'deleteGuest', 'addGroup', 'updateGroup', 'deleteGroup'].includes(actionType)) {
        await queueAction(actionType, data);
        console.log(`Successfully queued ${actionType} for future sync`);
      }
    } catch (queueError) {
      console.error(`Failed to queue offline action ${actionType}:`, queueError);
    }
  }

  // Try local fallback if provided
  if (fallbackFn && typeof fallbackFn === 'function') {
    try {
      console.log(`Attempting local fallback for ${actionType}`);
      return await fallbackFn();
    } catch (fallbackError) {
      console.error(`Fallback failed for ${actionType}:`, fallbackError);
    }
  }

  // Re-throw the error for the caller to handle
  throw error;
};

/**
 * Checks if the error is specifically an IndexedDB transaction error
 * for a missing object store and provides helpful debug information
 */
export const handleIndexedDBError = (error) => {
  if (error.name === 'NotFoundError' && 
      error.message && 
      error.message.includes('transaction') && 
      error.message.includes('object stores')) {
    
    console.error('IndexedDB schema error:', error.message);
    console.error('This usually indicates your database schema has changed but the version number was not updated');
    console.log('Try checking if DB_VERSION is incremented in db.js and that all object stores are properly defined');
    
    // To fix this for users, we could try to delete and recreate the database
    if (confirm('Database schema issue detected. Would you like to reset the local database to fix this issue?')) {
      console.log('Attempting to delete and recreate IndexedDB...');
      try {
        const req = indexedDB.deleteDatabase('guest-manager-db');
        req.onsuccess = () => {
          console.log('Database successfully deleted. Reloading page...');
          window.location.reload();
        };
        req.onerror = () => console.error('Could not delete database');
      } catch (e) {
        console.error('Error attempting to reset database:', e);
      }
    }
  }
  return error;
};

export default {
  handleApiError,
  handleIndexedDBError
};
