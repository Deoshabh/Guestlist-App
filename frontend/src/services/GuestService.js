/**
 * Guest Service - Handles guest data operations with the API and offline fallback
 * Implements the missing getGuests function and fixes API error handling
 */

import axios from 'axios';
import { getAllGuests, saveGuests, STORES, safeTransaction } from '../utils/db';
import { handleApiError, handleIndexedDBError } from '../utils/apiErrorHandler';

// Base API URL with environment-aware configuration
const API_URL = process.env.REACT_APP_API_URL || '/api';

class GuestService {
  /**
   * Fetch guests from the API with offline fallback
   * Implements the missing getGuests function that was causing errors
   */
  async getGuests() {
    try {
      console.log('Fetching guests from API...');
      const response = await axios.get(`${API_URL}/guests`);
      
      // Validate the response data
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid API response format for guests:', response.data);
        throw new Error('Invalid API response format');
      }
      
      // Cache the guests for offline use
      await saveGuests(response.data);
      return response.data;
    } catch (error) {
      // Use handleApiError from our utility
      return handleApiError(error, 'fetchGuests', {}, async () => {
        // Fallback to local data if available
        console.log('Falling back to local guest data...');
        const localGuests = await getAllGuests();
        if (localGuests && localGuests.length > 0) {
          console.log(`Retrieved ${localGuests.length} guests from local database`);
          return localGuests;
        }
        throw error; // Re-throw if no local data
      });
    }
  }

  /**
   * Fetch guest groups with enhanced error handling
   */
  async getGuestGroups() {
    try {
      console.log('Fetching guest groups from API...');
      const response = await axios.get(`${API_URL}/guests/groups`);
      
      // Validate response format to catch "ct" type errors
      if (!response.data || typeof response.data === 'string' && response.data.length < 5) {
        console.error('Invalid API response format for guest groups:', response.data);
        throw new Error('Invalid API response format');
      }
      
      // Save groups to IndexedDB for offline access
      try {
        await safeTransaction(STORES.GUEST_GROUPS, 'readwrite', (store, resolve) => {
          // Clear existing groups
          store.clear();
          
          // Add all groups
          const groups = Array.isArray(response.data) ? response.data : [response.data];
          const promises = groups.map(group => new Promise((res, rej) => {
            if (!group._id) {
              group._id = `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }
            const request = store.add(group);
            request.onsuccess = res;
            request.onerror = rej;
          }));
          
          Promise.allSettled(promises).then(() => {
            console.log(`Saved ${groups.length} guest groups to IndexedDB`);
            resolve(true);
          });
        });
      } catch (dbError) {
        console.error('Error saving guest groups to IndexedDB:', dbError);
        // Continue even if saving fails - we still have the API data
      }
      
      return response.data;
    } catch (error) {
      // Use our error handler utility with fallback to local data
      return handleApiError(error, 'fetchGuestGroups', {}, async () => {
        // Fallback to local data
        console.log('Falling back to local guest groups...');
        try {
          return await safeTransaction(STORES.GUEST_GROUPS, 'readonly', (store, resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
              const groups = request.result;
              console.log(`Retrieved ${groups.length} guest groups from local database`);
              resolve(groups);
            };
            request.onerror = (event) => reject(event.target.error);
          });
        } catch (dbError) {
          // Handle IndexedDB errors specifically
          handleIndexedDBError(dbError);
          return []; // Return empty array as last resort to prevent UI errors
        }
      });
    }
  }

  /**
   * Add a new guest with improved error handling
   */
  async addGuest(guest) {
    try {
      const response = await axios.post(`${API_URL}/guests`, guest);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'addGuest', guest);
    }
  }

  /**
   * Update an existing guest with improved error handling
   */
  async updateGuest(id, guest) {
    try {
      const response = await axios.put(`${API_URL}/guests/${id}`, guest);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'updateGuest', { id, ...guest });
    }
  }

  /**
   * Delete a guest with improved error handling
   */
  async deleteGuest(id) {
    try {
      const response = await axios.delete(`${API_URL}/guests/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'deleteGuest', { id });
    }
  }
}

// Export a singleton instance
export default new GuestService();

// Also export the class for testing or customization
export { GuestService };
