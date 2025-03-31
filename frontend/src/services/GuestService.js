import apiService from './ApiService';
import { handleApiError } from '../utils/errorHandler';

class GuestService {
  constructor() {
    this.apiService = apiService;
  }

  /**
   * Fetch all guests
   * @returns {Promise<Array>} List of guests
   */
  async getGuests() {
    try {
      return await this.apiService.getGuests();
    } catch (error) {
      const errorInfo = handleApiError(error, 'fetching guests');
      console.error('Failed to fetch guests:', errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Fetch a single guest by ID
   * @param {string} id Guest ID
   * @returns {Promise<Object>} Guest data
   */
  async getGuest(id) {
    try {
      return await this.apiService.getGuest(id);
    } catch (error) {
      const errorInfo = handleApiError(error, 'fetching guest details');
      console.error(`Failed to fetch guest ${id}:`, errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Create a new guest
   * @param {Object} guestData Guest data
   * @returns {Promise<Object>} Created guest
   */
  async createGuest(guestData) {
    try {
      return await this.apiService.createGuest(guestData);
    } catch (error) {
      const errorInfo = handleApiError(error, 'creating guest');
      console.error('Failed to create guest:', errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Update an existing guest
   * @param {string} id Guest ID
   * @param {Object} guestData Updated guest data
   * @returns {Promise<Object>} Updated guest
   */
  async updateGuest(id, guestData) {
    try {
      return await this.apiService.updateGuest(id, guestData);
    } catch (error) {
      const errorInfo = handleApiError(error, 'updating guest');
      console.error(`Failed to update guest ${id}:`, errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Delete a guest
   * @param {string} id Guest ID
   * @returns {Promise<Object>} Response data
   */
  async deleteGuest(id) {
    try {
      return await this.apiService.deleteGuest(id);
    } catch (error) {
      const errorInfo = handleApiError(error, 'deleting guest');
      console.error(`Failed to delete guest ${id}:`, errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Get all guest groups
   * @returns {Promise<Array>} List of guest groups
   */
  async getGuestGroups() {
    try {
      return await this.apiService.getGuestGroups();
    } catch (error) {
      const errorInfo = handleApiError(error, 'fetching guest groups');
      console.error('Failed to fetch guest groups:', errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Create a new guest group
   * @param {Object} groupData Group data
   * @returns {Promise<Object>} Created group
   */
  async createGuestGroup(groupData) {
    try {
      return await this.apiService.createGuestGroup(groupData);
    } catch (error) {
      const errorInfo = handleApiError(error, 'creating guest group');
      console.error('Failed to create guest group:', errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Update an existing guest group
   * @param {string} id Group ID
   * @param {Object} groupData Updated group data
   * @returns {Promise<Object>} Updated group
   */
  async updateGuestGroup(id, groupData) {
    try {
      return await this.apiService.updateGuestGroup(id, groupData);
    } catch (error) {
      const errorInfo = handleApiError(error, 'updating guest group');
      console.error(`Failed to update guest group ${id}:`, errorInfo.message);
      throw errorInfo;
    }
  }

  /**
   * Delete a guest group
   * @param {string} id Group ID
   * @returns {Promise<Object>} Response data
   */
  async deleteGuestGroup(id) {
    try {
      return await this.apiService.deleteGuestGroup(id);
    } catch (error) {
      const errorInfo = handleApiError(error, 'deleting guest group');
      console.error(`Failed to delete guest group ${id}:`, errorInfo.message);
      throw errorInfo;
    }
  }
}

// Create and export a singleton instance
const guestService = new GuestService();
export default guestService;

// Also export the class for testing
export { GuestService };
