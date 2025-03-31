import axios from 'axios';

const API_BASE_URL = '/api';

class ApiService {
  constructor(token = null) {
    this.token = token;
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Set authorization header if token is provided
    if (token) {
      this.setToken(token);
    }
  }

  setToken(token) {
    this.token = token;
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getGuests() {
    const response = await this.axiosInstance.get('/guests');
    return response.data;
  }

  async getGuest(id) {
    const response = await this.axiosInstance.get(`/guests/${id}`);
    return response.data;
  }

  async createGuest(guestData) {
    const response = await this.axiosInstance.post('/guests', guestData);
    return response.data;
  }

  async updateGuest(id, guestData) {
    const response = await this.axiosInstance.put(`/guests/${id}`, guestData);
    return response.data;
  }

  async deleteGuest(id) {
    const response = await this.axiosInstance.delete(`/guests/${id}`);
    return response.data;
  }

  async getGuestGroups() {
    const response = await this.axiosInstance.get('/guest-groups');
    return response.data;
  }

  async createGuestGroup(groupData) {
    const response = await this.axiosInstance.post('/guest-groups', groupData);
    return response.data;
  }

  async updateGuestGroup(id, groupData) {
    const response = await this.axiosInstance.put(`/guest-groups/${id}`, groupData);
    return response.data;
  }

  async deleteGuestGroup(id) {
    const response = await this.axiosInstance.delete(`/guest-groups/${id}`);
    return response.data;
  }

  // Helper for checking connection - always returns true in this version
  isOnline() {
    return true;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Also export the class for testing or if multiple instances are needed
export { ApiService };
