import apiService from './ApiService';

class NotificationService {
  constructor() {
    this.apiService = apiService;
  }

  /**
   * Sends a message to a guest
   * @param {string} guestId - The ID of the guest to message
   * @param {string} message - The message content
   * @returns {Promise<Object>} - The response data
   */
  async sendGuestMessage(guestId, message) {
    const response = await this.apiService.axiosInstance.post(`/guests/${guestId}/messages`, { 
      message,
      timestamp: new Date().toISOString()
    });
    return response.data;
  }

  /**
   * Sends a message to all guests in a group
   * @param {string} groupId - The ID of the group
   * @param {string} message - The message content
   * @returns {Promise<Object>} - The response data
   */
  async sendGroupMessage(groupId, message) {
    const response = await this.apiService.axiosInstance.post(`/guest-groups/${groupId}/messages`, { 
      message,
      timestamp: new Date().toISOString()
    });
    return response.data;
  }

  /**
   * Gets message history for a guest
   * @param {string} guestId - The ID of the guest
   * @returns {Promise<Array>} - Array of message objects
   */
  async getGuestMessageHistory(guestId) {
    const response = await this.apiService.axiosInstance.get(`/guests/${guestId}/messages`);
    return response.data;
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
