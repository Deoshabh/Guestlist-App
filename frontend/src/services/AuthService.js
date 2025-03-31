import apiService from './ApiService';

class AuthService {
  constructor() {
    this.apiService = apiService;
    this.tokenKey = 'auth_token';
    this.userKey = 'current_user';
    
    // Initialize token from storage if available
    const storedToken = localStorage.getItem(this.tokenKey);
    if (storedToken) {
      this.apiService.setToken(storedToken);
    }
  }

  /**
   * Log in a user
   * @param {string} username - Username or email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data with token
   */
  async login(username, password) {
    const response = await this.apiService.axiosInstance.post('/auth/login', {
      username,
      password
    });
    
    const { token, user } = response.data;
    
    // Save token and user info
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    
    // Set token in API service
    this.apiService.setToken(token);
    
    return response.data;
  }

  /**
   * Log out the current user
   */
  logout() {
    // Clear local storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // Clear token from API service
    this.apiService.setToken(null);
  }

  /**
   * Get the current auth token
   * @returns {string|null} The current token or null if not logged in
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get the current user data
   * @returns {Object|null} User data or null if not logged in
   */
  getCurrentUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if a user is currently logged in
   * @returns {boolean} Whether a user is logged in
   */
  isLoggedIn() {
    return !!this.getToken();
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

// Also export the class for testing
export { AuthService };
